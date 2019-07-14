'use strict';

addEventListener('error', (e) => {
  console.log(e);
});

<!--# include file="Architype.js" -->
<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
