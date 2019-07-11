class IdSource {
  constructor() {
    this.nextId_ = 1;
  }

  getId() {
    return ++this.nextId_;
  }

  setId(nextId) {
    this.nextId_ = nextId;
  }
}

const idSource = new IdSource();
