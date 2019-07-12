# Architype

Architype lets you quickly visualize directed graphs. It is designed for
realtime use during system and process design discussions.

Try it live at [architype.io](https://architype.io)

## Interface

### Input

Architype is designed to be used on devices with keyboards (hence the "type")
and optionally pointing devices. It can be used completely without the latter.

### Overview

The screen is divided into two panels:

* The editor, on the left, where you interactively define the components of your
  graph
* The visualization, on the right, where the results are displayed

### Object types

* A *node* is the fundamental unit in Architype, usually representing a server,
  service, or process step.
* A *link* connects nodes together. All links in Architype are directional,
  i.e. they have an arrow at exactly one end.
* A *group* is a collection of nodes that are shown physically together.
* A *label* is an optional description of another object, e.g. a link or a
  group.

### Keys

Generally lowercase and uppercase versions of a key have related but opposite
functions, for some meaning of "opposite". For example, lowercase `n` creates a
new node line below the current line, while uppercase `N` (`shift` + `n`)
creates a new node line above the current line.

Limited vi key mappings are supported. Key behavior is expected to match user
expectation across contexts in the UI.

#### Navigation

* `↓` `j` Move down the current list
* `↑` `k` Move up the current list
* `→` `l` `⏎` Enter (edit) the current list or item
* `←` `h` `␛` Exit the current list or item

`` ` `` (backtick) is mapped to `␛` for convenience on some keyboards, e.g.
iPads. This makes it impossible to use a backtick in a node or label, which is
considered a reasonable tradeoff.

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
* `f` [link only] Flip the direction of the current link

#### Misc

* `u` `browser back` Undo the last action
* `U` `browser forward` Redo the last undone action (if nothing else has been
  done since then)
* `m` Select the next theme (light/dark)
* `M` Select the previous theme (light/dark)
* `?` Add a help section below the current line

Note that it is possible to delete the help section with the normal delete
command `d`.

#### Highlight object creation

Groups and links can be created for existing nodes by highlighting the nodes
(using `␣`), then creating the group/link normally (`g`/`i`). When nodes are
highlighted, they are used to automatically populate the new group/link object.

#### Visualization

It is not possible to directly edit the position of items in the visualization.
This is a deliberate tradeoff for flexibility and speed of graph editing.

The visualization does support limited interaction: clicking/touching nodes
highlights the node and its corresponding editor entry.

## Storage & processing

Editor contents are stored in
[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
They can be expected to survive browser and system restarts, but are not copied
from your machine and are not long-term durable.

The full description of a graph is stored in the URL. To store the graph
long-term or to share it with others, copy/paste/record/share the full URL.

All Architype processing is local to the client machine. The is no server, no
data is sent, and the page contains no ads or third-party content.

## Development

### License

Licensed under the [Apache License 2.0](LICENSE).

### Structure

The code is organized into general categories:

* `Architype`
  * Initialization
  * Creation of the Editor and Grid
  * Launching background Workers
  * Serialization/deserialization
  * URL handling
  * localStorage
  * Undo/redo
* `Editor`
  * Runs in the UI thread
  * Interactive elements for graph description
* `Grid`
  * Runs in the UI thread
  * Interpreting commands from Layout
  * Drawing onto the CSS grid for visualization
* `Graph`
  * Runs in background Worker
  * Parsing the Editor serialization
  * Internal representation of the directed graph
* `Layout`
  * Runs in background Worker
  * Uses Graph data as input
  * Iterative spring model (with complex weighting) for nodes
  * Bidirectional weighted breadth-first search for links
  * Emit drawing commands for Grid
* Misc
  * IdSource
  * MinHeap
  * StringMap
  * utils

### Line drawing

Lines and arrows are drawn using sprited SVGs. Line curves are pre-generated in
a limited sprite set, and sprites are selected based on transitions between
adjacent grid squares.

### Browsers

We intend to support:

* Chrome
* Chrome Android (tablets)
* Edge Webkit
* Firefox
* Safari
* Safari iOS (iPad)

## Author

Ian Gulliver  
[architype@flamingcow.io](mailto:architype@flamingcow.io)  
[firestuff.org](https://firestuff.org/)
