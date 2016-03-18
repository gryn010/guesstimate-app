import {confidenceIntervalTextMixin} from './lib.js'

export const item = Object.assign(
  {}, confidenceIntervalTextMixin,
  {
    inputType: 'TEXT',
    formatterName: 'DISTRIBUTION_NORMAL_TEXT_UPTO',
    _symbols: ['['],
    format(g) {
      let [low, high] = this._numbers(g.text)
      if (!(isNaN(low) || isNaN(high))) {
        const guesstimateType = this.guesstimateType(g, low, high)
        return {guesstimateType, low, high}
      }
      return {}
    },
    _numbers(text) {
      return this._splitNumbersAt(text.replace('[', '').replace(']', ''), ',')
    },
  }
)
