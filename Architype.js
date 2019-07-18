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

    // Work around a Chrome cache bug(?) by only starting one render thread at
    // first, then starting the rest on first response from that thread. This
    // avoids downloading render.js once for each thread.
    this.render_ = [];
    this.renderThreadsToStart_ =
        Math.min(8, navigator.hardwareConcurrency || 2);
    this.renderThreadStart();
    this.render_[0].postMessage({
      command: 'ping',
    });

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

    this.observer_ = new MutationObserver(() => { this.onChange(); });
    this.observe();

    this.container_.addEventListener('renderRequest',
                                     () => { this.onRenderRequest(); });
    this.container_.addEventListener('snapshotRequest',
                                     () => { this.onSnapshotRequest(); });

    this.render();
    this.snapshot(true);
  }

  renderThreadStart() {
    let render = new Worker('render.js');
    render.addEventListener('message', (e) => { this.onRender(e); });
    this.render_.push(render);
    --this.renderThreadsToStart_;
  }

  observe() {
    this.observer_.observe(this.editorElem_, {
      childList: true,
      subtree: true,
    });
  }

  unobserve() {
    this.observer_.disconnect();
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
        this.backwardCompat1(ser);
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

  backwardCompat1(ser) {
    for (let item of ser.editor) {
      // 3bdb240
      if ((item.type == 'link' || item.type == 'group') &&
          item.label != null &&
          item.labelObj == undefined) {
        console.log('backward compat 3bdb240', item);
        item.labelObj = {
          highlight: false,
        };
      }

      // highlight
      if (item.highlight == undefined) {
        console.log('backward compat highlight', item);
        item.highlight = false;
      }
    }
  }

  overwrite(ser) {
    this.unobserve();
    this.editor_.clear();
    this.unserialize(ser);
    this.observe();
    this.render();
  }

  onHashChange() {
    if (location.hash.length > 1) {
      this.overwrite(JSON.parse(atob(location.hash.substring(1))));
    }
  }

  onPopState(e) {
    this.first_ = (e.state == 'first');
  }

  onRenderRequest() {
    ++this.generation_;
    this.render();
  }

  onSnapshotRequest() {
    this.snapshot(false);
  }

  onChange() {
    this.onRenderRequest();
    this.onSnapshotRequest();
  }

  snapshot(first) {
    this.serialized_ = this.serialize();
    this.serializedStr_ = JSON.stringify(this.serialized_);
    localStorage.setItem('currentState', this.serializedStr_);
    this.first_ = first || false;
    let hash = '#' + btoa(this.serializedStr_);
    if (first) {
      history.replaceState('first', null, hash);
    } else {
      history.pushState(null, null, hash);
    }
  }

  render() {
    this.serialized_ = this.serialize();
    this.startRender();
  }

  addDefaultEntries() {
    let help = this.editor_.addHelpAfter();

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
    node2.setHighlight(false);
    node3.setHighlight(false);

    node1.setHighlight(true);
    node3.setHighlight(true);
    let tag = this.editor_.addTagAfter();
    tag.setLabel('tag1');
    node1.setHighlight(false);
    node3.setHighlight(false);

    let label = this.editor_.addLabelAfter();
    label.setLabel('Example');

    node1.remove();
    node2.remove();
    node3.remove();

    help.getElement().focus();
  }

  setTheme(theme) {
    this.container_.classList.remove('theme-' + this.getTheme());
    this.container_.classList.add('theme-' + theme);
    localStorage.setItem('theme', theme);
  }

  getTheme() {
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

      case '+':
        this.toggleFullScreen();
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
    while (this.renderThreadsToStart_) {
      this.renderThreadStart();
    }

    if (e.data.command == 'pong') {
      return;
    }

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

  toggleFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (this.container_.requestFullscreen) {
      this.container_.requestFullscreen();
    } else if (this.container_.webkitRequestFullscreen) {
      this.container_.webkitRequestFullscreen();
    }
  }
}

<!--# include file="Editor.js" -->
<!--# include file="Grid.js" -->
<!--# include file="IdSource.js" -->
