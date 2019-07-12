# Architype

Architype lets you quickly visualize directed graphs. It is designed for
realtime use during system and process design discussions.

Try it live at [architype.io](https://architype.io)

## Interface

Architype is designed to be used on devices with keyboards (hence the "type")
and optionally mice/touchscreens. It can be used completely without the latter.

The screen is divided into two panels:

* The editor, on the left, where you interactively define the components of your
  graph.
* The visualization, on the right, where the results are displayed.

### Keys

Generally lowercase and uppercase versions of a key have related but opposite
functions, for some meaning of "opposite". For example, lowercase `n` creates a
new node line below the current line, while uppercase `n` (`shift` + `n`)
creates a new node line above the current line.

Limited vi key mappings are supported. Keys behavior is expected to match user
expectation across contexts in the UI.

#### Navigation

* `↓` `j` Move down the current list
* `↑` `k` Move up the current list
* `→` `l` `⏎` Enter (edit) the current list or item
* `←` `h` `␛` Exit the current list or item
