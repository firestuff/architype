'use strict';

function randStr32() {
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  return num.toString(16).padStart(8, '0');
}

function randStr64() {
  return randStr32() + randStr32();
}

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    this.container_.addEventListener('keydown', (e) => { this.onKeyDown(e); });
    addEventListener('resize', (e) => { this.onResize(e); });

    let editorElem = document.createElement('ul');
    this.container_.appendChild(editorElem);
    this.editor_ = new Editor(editorElem);

    this.targets_ = document.createElement('datalist');
    this.targets_.id = 'arch-targets';
    this.container_.appendChild(this.targets_);

    this.lines_ = document.createElement('div');
    this.lines_.innerHTML = `<!--# include file="lines.svg" -->`;
    this.lines_ = this.lines_.firstElementChild;
    this.lines_.classList.add('gridLines');
    this.lines_.classList.add('white');

    this.grid_ = document.createElement('div');
    this.grid_.classList.add('grid');
    this.container_.appendChild(this.grid_);

    this.unserialize(JSON.parse(localStorage.getItem('currentState')));

    this.observeStructure_ = new MutationObserver(e => { this.onStructureChange(e); });
    this.observeStructure_.observe(editorElem, {
      attributes: true,
      attributeFilter: ['data-struct-change'],
      childList: true,
      subtree: true,
    });

    // TODO: handle case when value change alters link graph
    this.observeContent_ = new MutationObserver(e => { this.onContentChange(e); });
    this.observeContent_.observe(editorElem, {
      attributes: true,
      attributeFilter: ['data-arch-value'],
      subtree: true,
    });

    this.onStructureChange();
  }

  serialize() {
    return {
      version: 1,
      editor: this.editor_.serialize(),
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    switch (ser.version) {
      case 1:
        this.editor_.unserialize(ser.editor);
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  onStructureChange(e) {
    this.graph_ = this.buildGraph();
    this.onContentChange(e);
  }

  onContentChange(e) {
    localStorage.setItem('currentState', JSON.stringify(this.serialize()));
    this.buildGrid(this.graph_);
    this.updateTargets(this.graph_);
    this.fixSizes(this.graph_.nodes);
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'z':
        this.exportGraphviz();
        break;
    }
  }

  onResize(e) {
    this.fixSizes(this.graph_.nodes);
  }

  exportGraphviz() {
    let lines = [
        'digraph G {',
        '\trankdir = "LR";',
    ];

    for (let type of ['nodes', 'links', 'groups']) {
      for (let obj of this.graph_[type]) {
        for (let line of obj.exportGraphviz()) {
          lines.push('\t' + line);
        }
      }
    }

    lines.push('}');
    navigator.clipboard.writeText(lines.join('\n'));
  }

  updateTargets(graph) {
    // Lots of effort to avoid churning the datalist

    let curTargets = new Map();
    for (let option of this.targets_.options) {
      curTargets.set(option.value, option);
    }

    for (let [label, entries] of graph.nodesByLabel.entries()) {
      if (curTargets.has(label)) {
        continue;
      }
      if (entries.length == 1 &&
          document.activeElement.parentElement.xArchObj &&
          document.activeElement.parentElement.xArchObj == entries[0]) {
        // Skip an element currently being edited
        continue;
      }
      let option = document.createElement('option');
      option.value = label;
      this.targets_.appendChild(option);
    }

    for (let [label, option] of curTargets.entries()) {
      if (graph.nodesByLabel.has(label)) {
        continue;
      }
      option.remove();
    }
  }

  buildGraph() {
    let graph = {
      nodesByLabel: new Map(),
      nodesByPageRank: new Map(),
      nodesByPos: new Map(),
      nodesBySubgraph: new Map(),
      groups: [],
      links: [],
      nodes: [],
    };
    // Order here is important, as each step carefully builds on data
    // constructed by the previous
    this.buildGraphInt(graph, this.editor_.getEntries());
    this.trimSoftNodes(graph);
    this.processLinks(graph);
    this.processGroups(graph);
    this.manifestNodes(graph);
    this.setPageRank(graph);
    this.bucketByPageRank(graph);
    this.bucketBySubgraph(graph);
    this.setInitialPositions(graph);
    this.setAffinity(graph);

    while (this.iterate(graph));
    this.fixOrigin(graph);

    return graph;
  }

  buildGraphInt(graph, entries) {
    for (let entry of entries) {
      if (entry instanceof Node) {
        this.buildGraphNode(graph, entry);
      } else if (entry instanceof Group) {
        this.buildGraphGroup(graph, entry);
      } else if (entry instanceof Link) {
        this.buildGraphLink(graph, entry);
      }
    }
  }

  buildGraphNode(graph, node) {
    node.clear();
    if (node.getLabel() == '') {
      return;
    }
    let targets = graph.nodesByLabel.get(node.getLabel());
    if (!targets) {
      targets = [];
      graph.nodesByLabel.set(node.getLabel(), targets);
    }
    targets.push(node);
  }

  buildGraphGroup(graph, group) {
    group.clear();
    graph.groups.push(group);
    this.buildGraphInt(graph, group.getNodes());
  }

  buildGraphLink(graph, link) {
    link.clear();
    graph.links.push(link);
    this.buildGraphInt(graph, [link.getFrom(), link.getTo()]);
  }

  trimSoftNodes(graph) {
    for (let entries of graph.nodesByLabel.values()) {
      for (let i = entries.length - 1; i >= 0 && entries.length > 1; --i) {
        if (entries[i] instanceof Node && entries[i].isSoft()) {
          entries.splice(i, 1);
        }
      }
    }
  }

  processLinks(graph) {
    for (let link of graph.links) {
      // Re-resolve each from/to reference by label, so we skip soft nodes and
      // handle multiple objects with the same label
      link.from = graph.nodesByLabel.get(link.getFrom().getLabel()) || [];
      link.to = graph.nodesByLabel.get(link.getTo().getLabel()) || [];
      for (let from of link.from) {
        for (let to of link.to) {
          from.links.push(to);
        }
      }
    }
  }

  processGroups(graph) {
    for (let group of graph.groups) {
      group.nodes = [];
      for (let member of group.getNodes()) {
        let nodes = graph.nodesByLabel.get(member.getLabel()) || [];
        for (let node of nodes) {
          group.nodes.push(node);
          node.groups.push(group);
        }
      }
    }
  }

  manifestNodes(graph) {
    for (let entries of graph.nodesByLabel.values()) {
      for (let entry of entries) {
        if (entry instanceof Node) {
          graph.nodes.push(entry);
        }
      }
    }
  }

  setPageRank(graph) {
    for (let link of graph.links) {
      for (let to of link.to) {
        this.setPageRankInt(to, new Set());
      }
    }
    for (let group of graph.groups) {
      // All members of a group get the rank of the maximum member, so the
      // initial positions will put them all near each other
      let maxRank = 0;
      for (let member of group.nodes) {
        maxRank = Math.max(maxRank, member.pageRank);
      }
      for (let member of group.nodes) {
        member.pageRank = maxRank;
      }
    }
  }

  setPageRankInt(node, visited) {
    if (visited.has(node)) {
      // Loop detection
      return;
    }
    ++node.pageRank;
    visited.add(node);
    for (let out of node.links) {
      this.setPageRankInt(out, visited);
    }
    visited.delete(node);
  }

  bucketByPageRank(graph) {
    for (let node of graph.nodes) {
      let bucket = graph.nodesByPageRank.get(node.pageRank);
      if (!bucket) {
        bucket = [];
        graph.nodesByPageRank.set(node.pageRank, bucket);
      }
      bucket.push(node);
    }
    let cmp = (a, b) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    };
    for (let bucket of graph.nodesByPageRank.values()) {
      bucket.sort(cmp);
    }
  }

  bucketBySubgraph(graph) {
    let nodes = new Set();
    let ranks = Array.from(graph.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let rank of ranks) {
      for (let node of graph.nodesByPageRank.get(rank)) {
        nodes.add(node);
      }
    }
    for (let subgraph = 0; nodes.size; ++subgraph) {
      let node = nodes.values().next().value;
      let subgraphArr = [];
      graph.nodesBySubgraph.set(subgraph, subgraphArr);
      this.recurseSubgraph(subgraph, subgraphArr, node, nodes);
    }
  }

  recurseSubgraph(subgraph, subgraphArr, node, nodes) {
    if (node.subgraph !== null) {
      return;
    }
    node.subgraph = subgraph;
    subgraphArr.push(node);
    nodes.delete(node);
    for (let to of node.links) {
      this.recurseSubgraph(subgraph, subgraphArr, to, nodes);
    }
    for (let group of node.groups) {
      for (let member of group.nodes) {
        this.recurseSubgraph(subgraph, subgraphArr, member, nodes);
      }
    }
  }

  setInitialPositions(graph) {
    const SPACING = 4;

    let maxRankNodes = 0;
    for (let nodes of graph.nodesByPageRank.values()) {
      maxRankNodes = Math.max(maxRankNodes, nodes.length);
    }

    let ranks = Array.from(graph.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let r = 0; r < ranks.length; ++r) {
      let nodes = graph.nodesByPageRank.get(ranks[r]);
      for (let n = 0; n < nodes.length; ++n) {
        let node = nodes[n];
        let pos = [
            r * SPACING,
            Math.floor((nodes.length / 2) * SPACING) + (n * SPACING) +
                (node.subgraph * SPACING * maxRankNodes),
        ];
        node.moveTo(graph, pos);
      }
    }
  }

  fixOrigin(graph) {
    let min = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let max = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    for (let node of graph.nodes) {
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], node.pos[i]);
        max[i] = Math.max(max[i], node.pos[i]);
      }
    }
    // Offset is negative minimum, e.g min -1 means +1 to all values
    for (let node of graph.nodes) {
      for (let i of [0, 1]) {
        node.pos[i] -= min[i];
      }
    }
    graph.size = [
        max[0] - min[0] + 1,
        max[1] - min[1] + 1,
    ];
  }

  setAffinity(graph) {
    const INF = 999999;
    for (let node of graph.nodes) {
      for (let other of graph.nodes) {
        // Weak affinity full mesh
        // Keep unassociated subgroups together
        this.addAffinity(node, other, d => d);

        if (node.subgraph != other.subgraph) {
          this.addAffinity(node, other, d => d < 1.5 ? -INF : 0);
        }
      }
      for (let to of node.links) {
        // Stronger affinity for links
        // Prefer to move toward the target instance
        this.addAffinity(node, to, d => d < 1.5 ? -INF : d * 11);
        this.addAffinity(to, node, d => d < 1.5 ? -INF : d * 9);
      }
      for (let group of node.groups) {
        for (let member of group.nodes) {
          // Even stronger affinity for groups
          // Other nodes will reference this one and take care of the full
          // group mesh
          this.addAffinity(node, member, d => d * 100);
        }
        let members = new Set(group.nodes);
        for (let other of graph.nodes) {
          if (members.has(other)) {
            continue;
          }
          // Nodes not in this group run away
          this.addAffinity(other, node, d => d < 1.5 ? -INF : 0);
        }
      }
    }
  }

  addAffinity(node, other, func) {
    if (node == other) {
      return;
    }
    node.affinity.push({
      node: other,
      distanceToWeight: func,
    });
  }

  buildGrid(graph) {
    this.grid_.innerHTML = '';

    this.grid_.style.gridTemplateColumns =
        'repeat(' + graph.size[0] + ',1fr)';
    this.grid_.style.gridTemplateRows =
        'repeat(' + graph.size[1] +
        ',minmax(0, calc((100vw - var(--editor-width)) / ' +
        graph.size[0] + ')))';

    this.drawGridNodes(graph);
  }

  addLines(pos, cls) {
    let lines = this.lines_.cloneNode(true);
    lines.classList.add(cls);
    lines.style.gridColumn = pos[0] + 1;
    lines.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(lines);
    return lines;
  }

  iterate(graph) {
    let nodes = Array.from(graph.nodes);
    this.sortByMostTension(nodes);
    for (let group of graph.groups) {
      nodes.push(group.getCollection());
    }
    for (let subgraph of graph.nodesBySubgraph.values()) {
      nodes.push(new Collection(subgraph));
    }

    let newOffset = null;
    let newTension = this.getTotalTension(nodes);
    for (let node of nodes) {
      let origPos = node.pos;
      let offsets = new Map();
      let addOffset = (x, y) => {
        if (!offsets.has([x, y].toString())) {
          offsets.set([x, y].toString(), [x, y]);
        }
      };
      for (let dir of [-1, 0, 1]) {
        addOffset(Math.sign(node.vec[0]), dir);
        addOffset(dir, Math.sign(node.vec[1]));
      }
      for (let offset of offsets.values()) {
        if (node.offsetCollides(graph, offset)) {
          continue;
        }
        node.savePos();
        node.moveBy(graph, offset);
        let testTension = this.getTotalTension(nodes);
        node.restorePos(graph);
        if (testTension < newTension) {
          newOffset = offset;
          newTension = testTension;
        }
      }
      if (newOffset) {
        node.moveBy(graph, newOffset);
        return true;
      }
    }
    return false;
  }

  getTotalTension(nodes) {
    let total = 0;
    for (let node of nodes) {
      node.setTension();
      total += node.tension;
    }
    return total;
  }

  sortByMostTension(nodes) {
    for (let node of nodes) {
      node.setTension();
    }
    nodes.sort((a, b) => b.tension - a.tension);
  }

  drawGridNodes(graph) {
    for (let node of graph.nodes) {
      node.gridElem = document.createElement('div');
      node.gridElem.classList.add('gridNode');
      this.grid_.appendChild(node.gridElem);
      node.gridElem.innerText = node.getLabel();
      node.gridElem.style.gridColumn = node.pos[0] + 1;
      node.gridElem.style.gridRow = node.pos[1] + 1;
    }
  }

  fixSizes(nodes) {
    for (let node of nodes) {
      let elem = node.gridElem;
      elem.style.fontSize = null;
      for (let size = 20;
           size && (elem.scrollWidth > elem.clientWidth ||
                    elem.scrollHeight > elem.clientHeight);
           --size) {
        elem.style.fontSize = size + 'px';
      }
    }
  }
}

class ListenUtils {
  constructor() {
    this.listeners_ = [];
  }

  listen(source, type, callback) {
    source.addEventListener(type, callback);
    this.listeners_.push([source, type, callback]);
  }

  clearListeners() {
    for (let [source, type, callback] of this.listeners_) {
      source.removeEventListener(type, callback);
    }
    this.listeners_ = [];
  }
}

class List {
  constructor(container) {
    this.container_ = container;
    this.minEntries_ = 0;
    this.maxEntries_ = Number.MAX_SAFE_INTEGER;
  }

  setMinEntries(min) {
    this.minEntries_ = min;
  }

  setMaxEntries(max) {
    this.maxEntries_ = max;
  }

  getEntries() {
    let ret = [];
    for (let elem of this.container_.children) {
      ret.push(elem.xArchObj);
    }
    return ret;
  }

  mayAdd() {
    return this.container_.children.length < this.maxEntries_;
  }

  getSelected() {
    let iter = document.activeElement;
    while (iter) {
      if (iter.parentElement == this.container_) {
        return iter;
      }
      iter = iter.parentElement;
    }
    return null;
  }

  deleteSelected() {
    if (this.container_.children.length <= this.minEntries_) {
      return;
    }
    let sel = this.getSelected();
    if (sel) {
      sel.xArchObj.remove();
    }
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    if (sel) {
      while (this.container_.lastElementChild != sel &&
             this.container_.children.length > this.minEntries_) {
        this.container_.lastElementChild.xArchObj.remove();
      }
      this.deleteSelected();
    }
  }

  selectNext() {
    let sel = this.getSelected() || this.container_.lastElementChild;
    if (sel) {
      this.select(sel.nextElementSibling ||
                  this.container_.firstElementChild);
    }
  }

  selectPrev() {
    let sel = this.getSelected() || this.container_.firstElementChild;
    if (sel) {
      this.select(sel.previousElementSibling ||
                  this.container_.lastElementChild);
    }
  }

  selectPrevPage() {
    let targetTop = this.container_.scrollTop - this.container_.clientHeight;
    let sel = this.getSelected() || this.container_.lastElementSibling;
    if (sel) {
      while (sel.previousElementSibling &&
             this.container_.scrollTop > targetTop) {
        sel = sel.previousElementSibling;
        this.select(sel);
      }
    }
  }

  selectNextPage() {
    let targetTop = this.container_.scrollTop + this.container_.clientHeight;
    let sel = this.getSelected() || this.container_.firstElementSibling;
    if (sel) {
      while (sel.nextElementSibling && this.container_.scrollTop < targetTop) {
        sel = sel.nextElementSibling;
        this.select(sel);
      }
    }
  }

  selectFirst() {
    this.select(this.container_.firstElementChild);
  }

  selectLast() {
    this.select(this.container_.lastElementChild);
  }

  select(elem) {
    if (!elem) {
      return;
    }
    elem.focus();
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
      case 'ArrowLeft':
      case 'h':
        if (this.container_.parentElement.xArchObj) {
          this.container_.parentElement.focus();
        }
        break;

      case 'd':
        this.deleteSelected();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'D':
        this.deleteSelectedAndAfter();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'j':
      case 'ArrowDown':
        this.selectNext();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'k':
      case 'ArrowUp':
        this.selectPrev();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'PageUp':
        this.selectPrevPage();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'PageDown':
        this.selectNextPage();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'Home':
        this.selectFirst();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'End':
        this.selectLast();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }
}

class Editor extends List {
  static NODE = 1;
  static GROUP = 2;
  static LINK = 3;

  constructor(container, allowedTypes) {
    super(container);

    this.allowedTypes_ = new Set(allowedTypes ||
                                 [Editor.NODE, Editor.GROUP, Editor.LINK]);

    this.container_.classList.add('editor');
    // Needs to accept focus to receive keydown, but shouldn't be in the normal
    // tab flow.
    this.container_.tabIndex = 99999;
    this.container_.addEventListener('keydown', e => { this.onKeyDown(e); });
    this.container_.focus();
  }

  clear() {
    this.container_.innerHTML = '';
  }

  serialize() {
    // Doesn't have a type, only used as part of other objects
    let ret = [];
    for (let entry of this.getEntries()) {
      ret.push(entry.serialize());
    }
    return ret;
  }

  unserialize(ser) {
    for (let entry of ser) {
      this.container_.appendChild(EditorEntryBase.unserialize(entry));
    }
  }

  isAllowed(type) {
    return this.mayAdd() && this.allowedTypes_.has(type);
  }

  addNodeAfter() {
    if (this.isAllowed(Editor.NODE)) {
      Node.addAfter(this.container_, this.getSelected());
    }
  }

  addNodeBefore() {
    if (this.isAllowed(Editor.NODE)) {
      Node.addBefore(this.container_, this.getSelected());
    }
  }

  addLinkAfter() {
    if (this.isAllowed(Editor.LINK)) {
      Link.addAfter(this.container_, this.getSelected());
    }
  }

  addLinkBefore() {
    if (this.isAllowed(Editor.LINK)) {
      Link.addBefore(this.container_, this.getSelected());
    }
  }

  addGroupAfter() {
    if (this.isAllowed(Editor.GROUP)) {
      Group.addAfter(this.container_, this.getSelected());
    }
  }

  addGroupBefore() {
    if (this.isAllowed(Editor.GROUP)) {
      Group.addBefore(this.container_, this.getSelected());
    }
  }
  
  onKeyDown(e) {
    switch (e.key) {
      case 'g':
        this.addGroupAfter();
        e.stopPropagation();
        e.preventDefault();
        return;
        
      case 'G':
        this.addGroupBefore();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'i':
        this.addLinkAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'I':
        this.addLinkBefore();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'n':
        this.addNodeAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'N':
        this.addNodeBefore();
        e.stopPropagation();
        e.preventDefault();
        return;
    }
    
    super.onKeyDown(e);
  }
}

class EditorEntryBase extends ListenUtils {
  constructor() {
    super();

    this.id = randStr64();

    this.elem_ = document.createElement('li');
    this.elem_.tabIndex = 0;
    this.listen(this.elem_, 'focus', () => this.onElemFocus());
    this.listen(this.elem_, 'keydown', (e) => this.onKeyDown(e));

    this.elem_.xArchObj = this;
  }

  remove() {
    if (document.activeElement == this.elem_ ||
        document.activeElement == document.body) {
      if (this.elem_.nextElementSibling) {
        this.elem_.nextElementSibling.focus();
      } else if (this.elem_.previousElementSibling) {
        this.elem_.previousElementSibling.focus();
      } else if (this.elem_.parentElement) {
        this.elem_.parentElement.focus();
      }
    }

    this.elem_.remove();
    this.clearListeners();
    this.elem_.xArchObj = null;
  }

  clear() {
  }

  wantFocus() {
    return false;
  }

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'nearest'});
  }

  onKeyDown(e) {
  }

  afterDomAdd() {
  }

  static addBefore(container, elem) {
    let entry = new this();
    container.insertBefore(entry.getElement(), elem);
    entry.afterDomAdd();
  }

  static addAfter(container, elem) {
    let entry = new this();
    container.insertBefore(entry.getElement(), elem ? elem.nextSibling : null);
    entry.afterDomAdd();
  }

  static unserialize(ser) {
    switch (ser.type) {
      case 'group':
        return Group.unserialize(ser);
      case 'link':
        return Link.unserialize(ser);
      case 'node':
        return Node.unserialize(ser);
    }
  }
}

class Node extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Node:';
    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.input_.setAttribute('list', 'arch-targets');
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'node',
      label: this.getLabel(),
    };
  }

  exportGraphviz() {
    if (this.getLabel() == '') {
      return [];
    }
    return ['"' + this.id + '" [label="' + this.getLabel() + '"];'];
  }

  clear() {
    super.clear();
    this.links = [];
    this.groups = [];
    this.affinity = [];
    this.pageRank = 0;
    this.subgraph = null;
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
  }

  getElement() {
    return this.elem_;
  }

  wantFocus() {
    return this.getLabel() == '';
  }

  isSoft() {
    // Nested nodes are presumed to be references to other nodes if they exist
    let iter = this.elem_.parentElement;
    for (let iter = this.elem_.parentElement; iter; iter = iter.parentElement) {
      if (iter.xArchObj) {
        return true;
      }
    }
    return false;
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let aff of this.affinity) {
      let vec = [], vecsum = 0;
      for (let i of [0, 1]) {
        vec[i] = aff.node.pos[i] - this.pos[i];
        vecsum += Math.abs(vec[i]);
      };
      let distance = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));
      let weight = aff.distanceToWeight(distance);
      for (let i of [0, 1]) {
        this.vec[i] += (weight * vec[i]) / vecsum;
      }
      this.tension += Math.abs(weight);
    }
  }

  offsetToPos(offset) {
    return [
        this.pos[0] + offset[0],
        this.pos[1] + offset[1],
    ];
  }

  offsetCollides(graph, offset) {
    let newPos = this.offsetToPos(offset);
    return graph.nodesByPos.get(newPos.toString());
  }

  moveBy(graph, offset) {
    this.moveTo(graph, this.offsetToPos(offset));
  }

  moveTo(graph, pos) {
    if (this.pos) {
      graph.nodesByPos.delete(this.pos.toString());
    }
    this.pos = pos;
    graph.nodesByPos.set(this.pos.toString(), this);
  }

  savePos() {
    this.savedPos = this.pos;
  }

  restorePos(graph) {
    this.moveTo(graph, this.savedPos);
  }

  onInput() {
    if (!this.input_.getAttribute('data-arch-value') ||
        this.input_.value == '') {
      this.input_.setAttribute('data-struct-change', 'x');
    }
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        if (this.elem_.nextElementSibling &&
            this.elem_.nextElementSibling.xArchObj &&
            this.elem_.nextElementSibling.xArchObj.wantFocus()) {
          this.elem_.nextElementSibling.xArchObj.startEdit();
        } else {
          this.stopEdit();
        }
        break;

      case 'Escape':
        e.stopPropagation();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let node = new Node();
    node.setLabel(ser.label);
    return node.getElement();
  }
}

class Collection {
  constructor(nodes) {
    this.nodes = nodes;
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let node of this.nodes) {
      node.setTension();
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      };
      this.tension += node.tension;
    }
  }

  offsetCollides(graph, offset) {
    // TODO: make this.nodes always a set
    let nodeSet = new Set(this.nodes);
    for (let node of this.nodes) {
      let other = node.offsetCollides(graph, offset);
      if (other && !nodeSet.has(other)) {
        return other;
      }
    }
    return null;
  }

  savePos() {
    for (let node of this.nodes) {
      node.savePos();
    }
  }

  restorePos(graph) {
    for (let node of this.nodes) {
      node.restorePos(graph);
    }
  }

  moveBy(graph, offset) {
    let nodes = new Set(this.nodes);
    while (nodes.size) {
      for (let node of nodes) {
        if (node.offsetCollides(graph, offset)) {
          continue;
        }
        node.moveBy(graph, offset);
        nodes.delete(node);
      }
    }
  }
}

class Group extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Group:';
    this.elem_.classList.add('group');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'group name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(1);
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'group',
      label: this.getLabel(),
      members: this.nodes_.serialize(),
    };
  }

  exportGraphviz() {
    let lines = [
        'subgraph "cluster_' + this.id + '" {',
    ];

    if (this.getLabel() != '') {
      lines.push('\tlabel = "' + this.getLabel() + '";');
    }

    for (let obj of this.nodes) {
      for (let line of obj.exportGraphviz()) {
        lines.push('\t' + line);
      }
    }

    lines.push('}');
    return lines;
  }

  clear() {
    super.clear();
  }

  getNodes() {
    return this.nodes_.getEntries();
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
  }

  getElement() {
    return this.elem_;
  }

  getCollection() {
    return new Collection(this.nodes);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes.length == 1 && nodes[0].getLabel() == '') {
            nodes[0].startEdit();
          }
        }
        break;

      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        break;
    }
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let group = new Group();
    group.setLabel(ser.label);
    group.nodes_.clear();
    group.nodes_.unserialize(ser.members);
    return group.getElement();
  }
}

class Link extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Link:';
    this.elem_.classList.add('link');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'label';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(2);
    this.nodes_.setMaxEntries(2);
    this.nodes_.addNodeAfter();
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'link',
      label: this.getLabel(),
      from: this.getFrom().serialize(),
      to: this.getTo().serialize(),
    };
  }

  exportGraphviz() {
    if (this.getFrom().getLabel() == '' || this.getTo().getLabel() == '') {
      return [];
    }

    let label = '';
    if (this.getLabel() != '') {
      label = ' [label="' + this.getLabel() + '"]';
    }

    let ret = [];
    for (let from of this.from) {
      for (let to of this.to) {
        ret.push('"' + from.id + '" -> "' + to.id + '"' + label + ';');
      }
    }

    return ret;
  };

  clear() {
    super.clear();
  }

  getFrom() {
    return this.nodes_.getEntries()[0];
  }

  getTo() {
    return this.nodes_.getEntries()[1];
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
  }

  getElement() {
    return this.elem_;
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes[0].getLabel() == '') {
            nodes[0].startEdit();
          } else if (nodes[1].getLabel() == '') {
            nodes[1].startEdit();
          }
        }
        break;

      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let link = new Link();
    link.setLabel(ser.label);
    link.nodes_.clear();
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}

new Architype(document.getElementById('architype'));
