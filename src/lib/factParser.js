import React from 'react'

import {EditorState, ContentState, Modifier, CompositeDecorator} from 'draft-js'

import {getSuggestion} from 'gModules/factBank/actions'

const NOUN_REGEX = /(\@[\w]+)/g
const PROPERTY_REGEX = /[a-zA-Z_](\.[\w]+)/g
function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText()
  let matchArr, start
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index + matchArr[0].indexOf(matchArr[1])
    callback(start, start + matchArr[1].length)
  }
}

const NounSpan = props => <span {...props} className='noun'>{props.children}</span>
const PropertySpan = props => <span {...props} className='property'>{props.children}</span>
const SuggestionSpan = props => <span {...props} className='suggestion'>{props.children}</span>

export const STATIC_DECORATOR_LIST = [
  {
    strategy: (contentBlock, callback) => { findWithRegex(NOUN_REGEX, contentBlock, callback) },
    component: NounSpan,
  },
  {
    strategy: (contentBlock, callback) => { findWithRegex(PROPERTY_REGEX, contentBlock, callback) },
    component: PropertySpan,
  },
]
export const STATIC_DECORATOR = {decorator: new CompositeDecorator(STATIC_DECORATOR_LIST)}
const positionDecorator = (start, end, component) => ({strategy: (contentBlock, callback) => {callback(start, end)}, component})

const factIsProperty = fact => fact.includes('.')

export function addText(editorState, text, maintainCursorPosition = true, anchorOffset = null, focusOffset = null) {
  const selection = editorState.getSelection()
  const content = editorState.getCurrentContent()

  let baseEditorState
  if (!anchorOffset || !focusOffset) {
    baseEditorState = EditorState.push(editorState, Modifier.insertText(content, selection, text), 'paste')
  } else {
    const replaceSelection = selection.merge({anchorOffset, focusOffset: focusOffset + 1})
    baseEditorState = EditorState.push(editorState, Modifier.replaceText(content, replaceSelection, text), 'paste')
  }

  if (!maintainCursorPosition) { return baseEditorState }

  const cursorPosition = selection.getFocusOffset()
  const newSelectionState = selection.merge({focusOffset: cursorPosition})
  return EditorState.forceSelection(baseEditorState, newSelectionState)
}

class Suggestor {
  constructor(editorState, previouslyRecommendedSuggestion) {
    this.editorState = editorState
    this.previouslyRecommendedSuggestion = previouslyRecommendedSuggestion

    this.cursorPosition = editorState.getSelection().getFocusOffset()
    this.text = editorState.getCurrentContent().getPlainText('')

    this.prevWord = this.text.slice(0, this.cursorPosition).split(/[^\w@\.]/).pop()

    this.nextWord = this.text.slice(this.cursorPosition).split(/[^\w]/)[0]
    this.inProperty = this.prevWord.includes('.')
  }

  run(){
    if (!this._shouldSuggest()) { return {suggestion: {text: '', isNoun: false}} }

    const partials = this.prevWord.slice(1).split('.')
    const suggestion = getSuggestion(partials)

    if (this._shouldRemoveSuggestion(suggestion)) {
      const noSuggestion = addText(this.editorState, '', true, this.cursorPosition, this.cursorPosition + this.previouslyRecommendedSuggestion.length)
      return {
        editorState: EditorState.set(noSuggestion, STATIC_DECORATOR),
        suggestion: { text: '', isNoun: false },
      }
    } else {
      return this._suggestionEditorState(partials.pop(), suggestion)
    }
  }

  _shouldRemoveSuggestion(newSuggestion){
    const hadSuggestion = !_.isEmpty(this.previouslyRecommendedSuggestion)
    const hasSuggestion = !_.isEmpty(newSuggestion)
    const samePlace = this.nextWord === this.previouslyRecommendedSuggestion
    return (hadSuggestion && !hasSuggestion && samePlace)
  }

  _shouldSuggest() {
    return this.prevWord.startsWith('@') && this.editorState.getSelection().isCollapsed()
  }

  _suggestionEditorState(precedingPartial, suggestion) {
    const {isProperty, editorState, previouslyRecommendedSuggestion, cursorPosition, nextWord} = this
    const decoratorComponent = isProperty ? PropertySpan : NounSpan

    const nextWordSuitable = [previouslyRecommendedSuggestion || '', suggestion || ''].includes(nextWord || '')
    if (_.isEmpty(suggestion) || !nextWordSuitable) { return {} }

    const decorator = new CompositeDecorator([
      positionDecorator(cursorPosition - precedingPartial.length - 1, cursorPosition, decoratorComponent),
      positionDecorator(cursorPosition, cursorPosition+suggestion.length, SuggestionSpan),
      ...STATIC_DECORATOR_LIST
    ])

    const newEditorState = EditorState.set(addText(editorState, suggestion, true, cursorPosition, cursorPosition+nextWord.length-1), {decorator})
    return {editorState: newEditorState, suggestion: {text: suggestion, isNoun: !isProperty}}
  }
}

export function addSuggestionToEditorState(editorState, previouslyRecommendedSuggestion){
  return (new Suggestor(editorState, previouslyRecommendedSuggestion)).run()
}

