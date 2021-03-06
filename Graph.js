class Graph {
  constructor(def) {
    this.nodesByLabel = new Map();
    this.nodesByPageRank = new Map();
    this.nodesBySubgraph = new Map();
    this.groups = [];
    this.links = [];
    this.nodes = [];
    this.tags = [];
    this.label = null;

    this.processList(def.editor);
    this.removeSoftNodes();
    this.resolveLinks();
    this.resolveGroups();
    this.resolveTags();
    this.flattenNodes();
    this.setPageRank();
    this.setSubgraph();
    this.bucketNodes();
  }

  processList(list, soft=false) {
    for (let item of list) {
      this.processItem(item, soft);
    }
  }

  processItem(item, soft=false) {
    switch (item.type) {
      case 'group':
        this.processGroup(item);
        break;

      case 'label':
        this.processLabel(item);
        break;

      case 'link':
        this.processLink(item);
        break;

      case 'node':
        this.processNode(item, soft);
        break;

      case 'tag':
        this.processTag(item);
        break;
    }
  }

  processGroup(item) {
    let group = GraphGroup.process(item);
    if (!group) {
      return;
    }
    this.groups.push(group);
    this.processList(item.members, true);
  }

  processLabel(item) {
    if (item.label == '') {
      return;
    }
    this.label = item.label;
    this.labelId = item.id;
  }

  processLink(item) {
    let link = GraphLink.process(item);
    if (!link) {
      return;
    }
    this.links.push(link);
    this.processItem(item.from, true);
    this.processItem(item.to, true);
  }

  processNode(item, soft=false) {
    let node = GraphNode.process(item, soft);
    if (!node) {
      return;
    }
    getOrSet(this.nodesByLabel, node.label, []).push(node);
  }

  processTag(item) {
    let tag = GraphTag.process(item);
    if (!tag) {
      return;
    }
    this.tags.push(tag);
    this.processList(item.members, true);
  }

  removeSoftNodes() {
    for (let nodes of this.nodesByLabel.values()) {
      for (let i = nodes.length - 1; i >= 0 && nodes.length > 1; --i) {
        if (nodes[i].soft) {
          nodes.splice(i, 1);
        }
      }
    }
  }

  resolveLinks() {
    for (let link of this.links) {
      link.resolve(this.nodesByLabel);
    }
  }

  resolveGroups() {
    for (let group of this.groups) {
      group.resolve(this.nodesByLabel);
    }
  }

  resolveTags() {
    for (let tag of this.tags) {
      tag.resolve(this.nodesByLabel);
    }
  }

  flattenNodes() {
    for (let nodes of this.nodesByLabel.values()) {
      this.nodes.push(...nodes);
    }
  }

  setPageRank() {
    for (let link of this.links) {
      link.setPageRank();
    }
    for (let group of this.groups) {
      group.setPageRank();
    }
  }

  setSubgraph() {
    let nodes = new Set(this.nodes);
    for (let subgraph = 0; nodes.size; ++subgraph) {
      let node = nodes.values().next().value;
      node.setSubgraph(subgraph, nodes);
    }
  }

  bucketNodes() {
    for (let node of this.nodes) {
      getOrSet(this.nodesByPageRank, node.pageRank, []).push(node);
      getOrSet(this.nodesBySubgraph, node.subgraph, []).push(node);
    }
    for (let nodes of this.nodesByPageRank.values()) {
      // Ensure deterministic sort order
      nodes.sort();
    }
  }
}

<!--# include file="GraphGroup.js" -->
<!--# include file="GraphLink.js" -->
<!--# include file="GraphNode.js" -->
<!--# include file="GraphTag.js" -->
