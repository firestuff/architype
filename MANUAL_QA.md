* Test: First load
  * Open new incognito/private window
  * Load [naked domain](https://architype.io/)
    * Verify editor help text appears
  * `n` for node
    * Verify editor node appears
    * Verify NOT grid node appears
  * Name node **1**
    * Verify grid node appears with label
  * `␣` to highlight node
    * Verify editor node highlight background appears
    * Verify grid node highlight border appears
  * `i` for link
    * Verify editor link appears
    * Verify edit link from set to **1**
    * Verify NOT grid link appears
  * Link to **2**
    * Verify grid node **2** appears with label
    * Verify grid link appears
  * Click/touch **2** in visualization
    * Verify grid node highlight border appears
    * Verify editor node highlight background appears
  * `u` to undo back to just help page
    * Verify undo to each step
    * Verify NOT undo past initial help text
* Test: Undo & redo
  * Open new incognito/private window
  * Load [hackernews](https://news.ycombinator.com/)
    * Verify some page load
  * Load [test page](https://architype.io/#eyJ2ZXJzaW9uIjoxLCJnZW5lcmF0aW9uIjo0MywibmV4dElkIjo4MywiZWRpdG9yIjpbeyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnkzIiwibGFiZWwiOiIyIiwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnk0IiwibGFiZWwiOiIyIiwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnk1IiwibGFiZWwiOiIyIiwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibGluayIsImlkIjoiZW50cnk2IiwibGFiZWwiOm51bGwsImZyb20iOnsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5NyIsImxhYmVsIjoiMSIsImhpZ2hsaWdodCI6ZmFsc2V9LCJ0byI6eyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnk4IiwibGFiZWwiOiIyIiwiaGlnaGxpZ2h0IjpmYWxzZX0sImhpZ2hsaWdodCI6ZmFsc2V9LHsidHlwZSI6ImxpbmsiLCJpZCI6ImVudHJ5OSIsImxhYmVsIjpudWxsLCJmcm9tIjp7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTEwIiwibGFiZWwiOiIyIiwiaGlnaGxpZ2h0IjpmYWxzZX0sInRvIjp7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTExIiwibGFiZWwiOiIzIiwiaGlnaGxpZ2h0IjpmYWxzZX0sImhpZ2hsaWdodCI6ZmFsc2V9LHsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MTIiLCJsYWJlbCI6IjQiLCJoaWdobGlnaHQiOmZhbHNlfSx7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTEzIiwibGFiZWwiOiI0IiwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnkxNCIsImxhYmVsIjoiNCIsImhpZ2hsaWdodCI6ZmFsc2V9LHsidHlwZSI6Imdyb3VwIiwiaWQiOiJlbnRyeTE1IiwibGFiZWwiOm51bGwsIm1lbWJlcnMiOlt7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTE2IiwibGFiZWwiOiI0IiwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnkxNyIsImxhYmVsIjoiNCIsImhpZ2hsaWdodCI6ZmFsc2V9LHsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MTgiLCJsYWJlbCI6IjQiLCJoaWdobGlnaHQiOmZhbHNlfSx7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTE5IiwibGFiZWwiOiJhIiwiaGlnaGxpZ2h0IjpmYWxzZX1dLCJoaWdobGlnaHQiOmZhbHNlfSx7InR5cGUiOiJsaW5rIiwiaWQiOiJlbnRyeTIwIiwibGFiZWwiOm51bGwsImZyb20iOnsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MjEiLCJsYWJlbCI6IjMiLCJoaWdobGlnaHQiOmZhbHNlfSwidG8iOnsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MjIiLCJsYWJlbCI6IjQiLCJoaWdobGlnaHQiOmZhbHNlfSwiaGlnaGxpZ2h0IjpmYWxzZX0seyJ0eXBlIjoibGluayIsImlkIjoiZW50cnkyMyIsImxhYmVsIjpudWxsLCJmcm9tIjp7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTI0IiwibGFiZWwiOiI0IiwiaGlnaGxpZ2h0IjpmYWxzZX0sInRvIjp7InR5cGUiOiJub2RlIiwiaWQiOiJlbnRyeTI1IiwibGFiZWwiOiI1IiwiaGlnaGxpZ2h0IjpmYWxzZX0sImhpZ2hsaWdodCI6ZmFsc2V9LHsidHlwZSI6ImxpbmsiLCJpZCI6ImVudHJ5MjYiLCJsYWJlbCI6bnVsbCwiZnJvbSI6eyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnkyNyIsImxhYmVsIjoieCIsImhpZ2hsaWdodCI6ZmFsc2V9LCJ0byI6eyJ0eXBlIjoibm9kZSIsImlkIjoiZW50cnkyOCIsImxhYmVsIjoieSIsImhpZ2hsaWdodCI6ZmFsc2V9LCJoaWdobGlnaHQiOmZhbHNlfSx7InR5cGUiOiJsaW5rIiwiaWQiOiJlbnRyeTI5IiwibGFiZWwiOm51bGwsImZyb20iOnsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MzEiLCJsYWJlbCI6InkiLCJoaWdobGlnaHQiOmZhbHNlfSwidG8iOnsidHlwZSI6Im5vZGUiLCJpZCI6ImVudHJ5MzAiLCJsYWJlbCI6IngiLCJoaWdobGlnaHQiOmZhbHNlfSwiaGlnaGxpZ2h0IjpmYWxzZX1dLCJzZWxlY3RlZCI6ImVudHJ5MTQifQ==) in same tab
    * Verify grid structure:
      * 1 -> {2,2,2} -> 3 -> {4,4,4} -> 5
      * (4,4,4,a)
      * x <-> y
  * `d` repeatedly to delete all editor objects
    * Verify deletion of all editor objects
    * Verify deletion of all grid objects
  * `u` repeatedly to undo all deletion
    * Verify step-by-step restoration of each individual editor object
    * Verify step-by-step restoration of each individual grid object
    * Verify NOT extra `u` after all deletion does navigate back to hackernews
  * `U` repeatedly to redo all deletion
    * Verify step-by-step deletion of each individual editor object
    * Verify step-by-step deletion of each individual grid object
  * `browser back` repeatedly to undo all deletion
    * Verify step-by-step restoration of each individual editor object
    * Verify step-by-step restoration of each individual grid object
    * Verify extra `browser back` after all deletion does navigate back to hackernews
  * `browser forward` repeatedly to navigate back to archityep and redo all deletion
    * Verify nagivate back to architype and correct initial state
    * Verify step-by-step deletion of each individual editor object
    * Verify step-by-step deletion of each individual grid object
