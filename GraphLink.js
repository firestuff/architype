class GraphLink {
  constructor() {
  }

  resolve(nodesByLabel) {
    this.from = nodesByLabel.get(this.fromLabel);
    this.to = nodesByLabel.get(this.toLabel);
    for (let from of this.from) {
      for (let to of this.to) {
        from.links.push({
          to: to,
          id: this.id,
          label: this.label,
          labelId: this.labelId,
        });
        to.linksIn.push({
          from: from,
          id: this.id,
          label: this.label,
          labelId: this.labelId,
        });
      }
    }
  }

  setPageRank() {
    for (let to of this.to) {
      to.incPageRank(new Set());
    }
  }

  static process(item) {
    let link = new GraphLink();
    link.id = item.id;
    link.label = item.label;
    link.labelId = item.labelObj.id;
    link.fromLabel = item.from.label;
    link.toLabel = item.to.label;
    if (link.fromLabel == '' || link.toLabel == '') {
      return null;
    }
    return link;
  }
}
