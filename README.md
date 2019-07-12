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

### Object types

* A *node* is the fundamental unit in Architype, usually representing a server,
  service, or process step.
* A *link* is connects nodes together. All links in Architype are directional,
  i.e. they have an arrow at exactly one end.
* A *group* is a collection of nodes that are physically together.
* A *label* is an optional description of another object, e.g. a link or a
  group.

### Keys

Generally lowercase and uppercase versions of a key have related but opposite
functions, for some meaning of "opposite". For example, lowercase `n` creates a
new node line below the current line, while uppercase `N` (`shift` + `n`)
creates a new node line above the current line.

Limited vi key mappings are supported. Keys behavior is expected to match user
expectation across contexts in the UI.

#### Navigation

* `↓` `j` Move down the current list
* `↑` `k` Move up the current list
* `→` `l` `⏎` Enter (edit) the current list or item
* `←` `h` `␛` Exit the current list or item

#### New objects

* `n` Create new node below the current line
* `shift` + `n` Create new node above the current line
* `g` Create new group below the current line
* `shift` + `g` Create new group above the current line
* `i` Create new link below the current line
* `shift` + `i` Create new link above the current line
* `a` Create new label below the current line
* `shift` + `a` Create new label above the current line

#### Deletion & modification

* `d` Delete the current line
* `shift` + `d` Delete the current line and all lines after it
* `␣` (`space`) Toggle highlighting of the current line
* `f` [link only] Flip the directional of the current link

#### Misc

* `u` `browser back` Undo the last action
* `U` `browser forward` Redo the last undone action (if nothing else has been
  done since then)
* `m` Select the next theme (light/dark)
* `M` Select the previous theme (light/dark)
