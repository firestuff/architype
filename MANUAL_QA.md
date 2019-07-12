* Test: First load
  * Steps
    * Open incognito/private window
    * Load [naked domain](https://architype.io/)
      * Verify editor help text appears
    * `n` for node
      * Verify editor node appears
      * Verify grid node does NOT appear
    * Name node **1**
      * Verify grid node appears with label
    * `␣` to highlight node
      * Verify editor node highlight background appears
      * Verify grid node highlight border appears
    * `i` for link
      * Verify editor link appears
      * Verify edit link from set to **1**
      * Verify grid link does NOT appear
    * Link to **2**
      * Verify grid node **2** appears with label
      * Verify grid link appears
    * Click/touch **2** in visualization
      * Verify grid node highlight border appears
      * Verify editor node highlight background appears
    * `u` to undo back to just help page
      * Verify undo to each step
      * Verify NOT undo past initial help text
