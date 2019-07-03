<!--# include file="ListenUtils.js" -->

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
        return EditorGroup.unserialize(ser);
      case 'link':
        return EditorLink.unserialize(ser);
      case 'node':
        return EditorNode.unserialize(ser);
    }
  }
}
