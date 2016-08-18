export function change(values) {
  return { type: 'CHANGE_CANVAS_STATE', values }
}

export function allowEdits() {
  return (dispatch, getState) => {
    dispatch(changeActionState(''))
    dispatch({ type: 'CHANGE_CANVAS_STATE', values: { editsAllowed: true } })
  }
}

export function forbidEdits() {
  return (dispatch, getState) => {
    dispatch(changeActionState(''))
    dispatch({ type: 'CHANGE_CANVAS_STATE', values: { editsAllowed: false } })
  }
}

export function toggleView(view) {
  return (dispatch, getState) => {
    const {canvasState: {analysisViewEnabled, expandedViewEnabled, scientificViewEnabled}} = getState()
    let values = {}
    switch (view) {
      case 'analysis':
        values.analysisViewEnabled = !analysisViewEnabled
        break
      case 'expanded':
        values.expandedViewEnabled = !expandedViewEnabled
        break
      case 'scientific':
        values.scientificViewEnabled = !scientificViewEnabled
        break
    }
    if (!_.isEmpty(values)) { dispatch({type: 'CHANGE_CANVAS_STATE', values}) }
  }
}

export function changeMetricClickMode(metricClickMode) {
  return { type: 'CHANGE_CANVAS_STATE', values: {metricClickMode: _.isEmpty(metricClickMode) ? 'DEFAULT' : metricClickMode} }
}

export function changeActionState(actionState) {
  return { type: 'CHANGE_CANVAS_STATE', values: {actionState} }
}

export function analyzeMetricId(id) {
  return { type: 'CHANGE_CANVAS_STATE', values: {analysisMetricId: id} };
}

export function endAnalysis(id) {
  return { type: 'CHANGE_CANVAS_STATE', values: {analysisMetricId: ''} };
}
