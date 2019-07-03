function render(def) {
  let graph = new Graph(def);
  let layout = new Layout(graph);
  return layout.getDrawSteps();
}

<!--# include file="Graph.js" -->
<!--# include file="Layout.js" -->
