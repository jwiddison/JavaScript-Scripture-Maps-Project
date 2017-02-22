/*========================================================================
 * FILE:    xpath.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    21 Feb 2017
 *
 * DESCRIPTION: This module contains the JavaScript XPath-processing code
 * needed for Project 2, IS 542, Winter 2017, BYU.
 */
/*property
    DOCUMENT_TYPE_NODE, getAttribute, getRangeAt, getSelection,
    getSelectionOffset, id, join, length, nodeName, nodeType, parentNode,
    previousSibling, rangeCount, splice, startContainer, startOffset, tagName,
    toLowerCase
*/
/*global Node, window */
/*jslint es6 browser: true */

let Xpath = (function () {
    // Force the browser into JavaScript strict compliance mode.
    "use strict";

    /*------------------------------------------------------------------------
     *                      PRIVATE METHOD DECLARATIONS
     */
    let getNodeTreeXPath;
    let getNodeXPath;
    let getSelectionOffset;

    /*------------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
    getNodeTreeXPath = function (node) {
        let paths = [];

        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        while (node !== undefined && node !== null && (node.nodeType === 1 || node.nodeType === 3)) {
            let index = 0;

            // EXTRA TEST FOR ELEMENT.ID
            if (node && node.id) {
                paths.splice(0, 0, "/*[@id=\"" + node.id + "\"]");
                break;
            }

            let sibling = node.previousSibling;

            while (sibling !== undefined && sibling !== null) {
                // Ignore document type declaration.
                if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE) {
                    if (sibling.nodeName === node.nodeName) {
                        index += 1;
                    }
                }

                sibling = sibling.previousSibling;
            }

            let tagName = (node.nodeType === 1
                ? node.nodeName.toLowerCase()
                : "text()");
            let pathIndex = (index
                ? "[" + (index + 1) + "]"
                : "");

            paths.splice(0, 0, tagName + pathIndex);
            node = node.parentNode;
        }

        return paths.length
            ? "/" + paths.join("/")
            : null;
    };

    // See http://stackoverflow.com/questions/3454526
    getNodeXPath = function (node) {
        if (node !== undefined && node !== null && node.id !== undefined) {
            return "//*[@id=\"" + node.id + "\"]";
        } else {
            return getNodeTreeXPath(node);
        }
    };

    getSelectionOffset = function () {
        if (window.getSelection !== undefined) {
            let selection = window.getSelection();

            if (selection.rangeCount !== undefined && selection.rangeCount > 0) {
                let range = selection.getRangeAt(0);
                let node = range.startContainer;

                while (node !== undefined && node !== null) {
                    // Look for parent node that has the verse number
                    if (node.tagName === "A" && node.getAttribute("name") !== undefined &&
                            node.getAttribute("name") !== null) {
                        // We found a verse number, so that's enough to identify the offset
                        return node.getAttribute("name") + "@" + range.startOffset;
                    }

                    node = node.parentNode;
                }

                // If verse number not found, send Xpath
                return getNodeXPath(range.startContainer) + "@" + range.startOffset;
            }
        }

        // Something went horribly wrong (http://xkcd.com/1047/)
        return "";
    };

    /*------------------------------------------------------------------------
     *                      PUBLIC API
     */
    return {
        // Return the offset string for the current text selection.
        getSelectionOffset() {
            return getSelectionOffset();
        }
    };
}());
