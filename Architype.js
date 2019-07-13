'use strict';

addEventListener('error', (e) => {
  console.log(e);
});

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');

    this.themes_ = ['light', 'dark'];
    this.setTheme(localStorage.getItem('theme') || 'dark');

    document.addEventListener('keydown', (e) => { this.onKeyDown(e); });

    this.editorElem_ = document.createElement('ul');
    this.container_.appendChild(this.editorElem_);
    this.editor_ = new Editor(this.editorElem_);

    this.gridElem_ = document.createElement('div');
    this.container_.appendChild(this.gridElem_);
    this.grid_ = new Grid(this.gridElem_);

    this.generation_ = 0;
    this.renderGeneration_ = -1;
    this.drawGeneration_ = -1;

    this.render_ = [];
    for (let i = 0; i < (navigator.hardwareConcurrency || 2); ++i) {
      let render = new Worker('render.js');
      render.addEventListener('message', (e) => { this.onRender(e); });
      this.render_.push(render);
    }

    addEventListener('hashchange', (e) => { this.onHashChange(e); });
    addEventListener('popstate', (e) => { this.onPopState(e); });
    this.first_ = true;

    if (location.hash.length > 1) {
      this.unserialize(JSON.parse(atob(location.hash.substring(1))));
    } else {
      this.unserialize(JSON.parse(localStorage.getItem('currentState')));
    }
    if (this.editor_.getEntries().length == 0) {
      this.addDefaultEntries();
    }

    this.observer_ = new MutationObserver(e => { this.onChange(e); });
    this.observer2_ = new MutationObserver(e => { this.snapshot(e); });
    this.observe();

    this.saveAndRender();

    history.replaceState('first', null, '#' + btoa(this.serializedStr_));
  }

  observe() {
    this.observer_.observe(this.editorElem_, {
      attributes: true,
      attributeFilter: ['data-arch-refresh'],
      childList: true,
      subtree: true,
    });
    this.observer2_.observe(this.editorElem_, {
      attributes: true,
      attributeFilter: ['data-arch-snapshot'],
      childList: true,
      subtree: true,
    });
  }

  unobserve() {
    this.observer_.disconnect();
    this.observer2_.disconnect();
  }

  serialize() {
    let selected = null;
    let iter = document.activeElement;
    while (iter) {
      if (iter.xArchObj && iter.id) {
        selected = iter.id;
        break;
      }
      iter = iter.parentElement;
    }

    return {
      version: 1,
      generation: this.generation_,
      nextId: idSource.peekId(),
      editor: this.editor_.serialize(),
      selected: selected,
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    this.renderGeneration_ = -1;
    this.drawGeneration_ = -1;

    switch (ser.version) {
      case 1:
        this.generation_ = ser.generation;
        idSource.setId(ser.nextId);
        this.editor_.unserialize(ser.editor);
        if (ser.selected) {
          let elem = document.getElementById(ser.selected);
          if (elem) {
            elem.focus();
          }
        } else {
          this.editor_.selectNext();
        }
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  overwrite(ser) {
    this.unobserve();
    this.editor_.clear();
    this.unserialize(ser);
    this.observe();
    this.saveAndRender();
  }

  onHashChange() {
    if (location.hash.length > 1) {
      this.overwrite(JSON.parse(atob(location.hash.substring(1))));
    }
  }

  onPopState(e) {
    this.first_ = (e.state == 'first');
  }

  onChange() {
    ++this.generation_;
    this.saveAndRender();
  }

  snapshot() {
    history.pushState(null, null, '#' + btoa(this.serializedStr_));
    this.first_ = false;
  }

  saveAndRender() {
    this.serialized_ = this.serialize();
    this.startRender();
    this.serializedStr_ = JSON.stringify(this.serialized_);
    localStorage.setItem('currentState', this.serializedStr_);
  }

  addDefaultEntries() {
    this.editor_.addHelpAfter();

    let node1 = this.editor_.addNodeAfter();
    node1.setLabel('node1');

    let node2 = this.editor_.addNodeAfter();
    node2.setLabel('node2');

    node1.setHighlight(true);
    node2.setHighlight(true);
    let link = this.editor_.addLinkAfter();
    link.setLabel('link1');
    node1.setHighlight(false);
    node2.setHighlight(false);

    let node3 = this.editor_.addNodeAfter();
    node3.setLabel('node3');

    node2.setHighlight(true);
    node3.setHighlight(true);
    let group = this.editor_.addGroupAfter();
    group.setLabel('group1');

    let label = this.editor_.addLabelAfter();
    label.setLabel('Example');
  }

  setTheme(theme) {
    this.container_.classList.remove('theme-' + this.getTheme());
    this.container_.classList.add('theme-' + theme);
    localStorage.setItem('theme', theme);
  }

  getTheme() {
    let classes = Array.from(this.container_.classList);
    for (let cls of this.container_.classList) {
      if (cls.startsWith('theme-')) {
        return cls.substring(6);
      }
    }
  }

  nextTheme() {
    let cur = this.themes_.indexOf(this.getTheme());
    this.setTheme(this.themes_[(cur + 1) % this.themes_.length]);
  }

  prevTheme() {
    let cur = this.themes_.indexOf(this.getTheme());
    let num = this.themes_.length;
    let next = (((cur - 1) % num) + num) % num;
    this.setTheme(this.themes_[next]);
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'm':
        this.nextTheme();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'M':
        this.prevTheme();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'u':
        // Stop us from backing up out of the page
        if (!this.first_) {
          history.back();
        }
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'U':
        history.forward();
        e.stopPropagation();
        e.preventDefault();
        return;
    }

    let elem = document.activeElement;
    while (elem) {
      if (elem == this.editorElem_) {
        return;
      }
      elem = elem.parentElement;
    }
    this.editor_.onKeyDown(e);
  }

  onRender(e) {
    this.render_.push(e.target);

    if (e.data.generation > this.drawGeneration_) {
      // Received newer than we've drawn; redraw
      this.drawGeneration_ = e.data.generation;
      this.grid_.draw(e.data.steps);
    }

    this.startRender();
  }

  startRender() {
    if (this.generation_ == this.renderGeneration_) {
      // Already sent this generation for rendering
      return;
    }

    let render = this.render_.pop();
    if (!render) {
      // Ran out of workers
      return;
    }

    this.renderGeneration_ = this.serialized_.generation;
    render.postMessage(this.serialized_);
  }
}

<!--# include file="Editor.js" -->
<!--# include file="Grid.js" -->
<!--# include file="IdSource.js" -->

<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
