addEventListener('message', (e) => {
  let graph = new Graph(e.data);
  let layout = new Layout(graph);
  postMessage({
    generation: e.data.generation,
    steps: layout.getDrawSteps(),
  });
});

<!--# include file="Graph.js" -->
<!--# include file="Layout.js" -->

<!--# include file="utils.js" -->
