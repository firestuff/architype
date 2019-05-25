let def = document.getElementById('definition');

document.addEventListener('keydown', e => {
  console.log(e.key);

  let sel = def.getElementsByClassName('selected').item(0);

  switch (e.key) {
    case 'd':
      if (sel) {
        let newSel = sel.nextElementSibling || sel.previousElementSibling;
        if (newSel) {
          newSel.classList.add('selected');
        }
        sel.remove();
      }
      break;

    case 'D':
      while (sel.nextElementSibling) {
        sel.nextElementSibling.remove();
      }
      if (sel.previousElementSibling) {
        sel.previousElementSiblist.classList.add('selected');
      }
      sel.remove();
      break;

    case 'j':
    case 'ArrowDown':
      if (sel) {
        let newSel = sel.nextElementSibling || def.firstElementChild;
        sel.classList.remove('selected');
        newSel.classList.add('selected');
      }
      break;

    case 'k':
    case 'ArrowUp':
      if (sel) {
        let newSel = sel.previousElementSibling || def.lastElementChild;
        sel.classList.remove('selected');
        newSel.classList.add('selected');
      }
      break;

    case 'PageUp':
      if (sel) {
        let pageCount = Math.floor(def.clientHeight / sel.clientHeight) - 1;
        let newSel = sel;
        for (let i = 0; i < pageCount; ++i) {
          newSel = newSel.previousElementSibling || def.firstElementChild;
        }
        sel.classList.remove('selected');
        newSel.classList.add('selected');
      }
      break;

    case 'PageDown':
      if (sel) {
        let pageCount = Math.floor(def.clientHeight / sel.clientHeight) - 1;
        let newSel = sel;
        for (let i = 0; i < pageCount; ++i) {
          newSel = newSel.nextElementSibling || def.lastElementChild;
        }
        sel.classList.remove('selected');
        newSel.classList.add('selected');
      }
      break;

    case 'Home':
      if (sel) {
        sel.classList.remove('selected');
        def.firstElementChild.classList.add('selected');
      }
      break;

    case 'G': // vi compat
    case 'End':
      if (sel) {
        sel.classList.remove('selected');
        def.lastElementChild.classList.add('selected');
      }
      break;

    case 'n':
      {
        let node = document.createElement('li');
        node.innerText = 'Node: ';

        let input = document.createElement('input');
        input.type = 'text';
        node.appendChild(input);

        node.classList.add('node');
        def.insertBefore(node, sel ? sel.nextSibling : null);

        if (sel) {
          sel.classList.remove('selected');
        }
        node.classList.add('selected');
      }
      break;

    case 'N':
      {
        let node = document.createElement('li');
        node.innerText = 'Node: ';

        let input = document.createElement('input');
        input.type = 'text';
        node.appendChild(input);

        node.classList.add('node');
        def.insertBefore(node, sel);

        if (sel) {
          sel.classList.remove('selected');
        }
        node.classList.add('selected');
      }
      break;
  }

  sel = def.getElementsByClassName('selected').item(0);

  if (sel) {
    sel.scrollIntoView({
      block: 'center',
    });
  }
});
