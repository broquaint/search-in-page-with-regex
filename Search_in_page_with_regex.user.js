// ==UserScript==
// @name        Search in page with regex
// @namespace   dbrook-desktop
// @description Like "Find in page" but with a regex
// @include     *
// @version     1
// @grant       none
// ==/UserScript==

"use strict";

const MATCH_SEL_CLASS = 'regex-search';

document.addEventListener('keyup', watchForFind);

setupSelectionStyle();

handleSelectionBlur();

function watchForFind(e) {
    if(e.code === 'KeyF' && e.altKey)
        doSearch();
}

function doSearch() {
    const re = new RegExp(prompt('Search by:'), 'gi');

    const matches = document.body.textContent.match(re);
    // console.log(`Looking for '${re}' and found: ${matches}`);

    if(!matches)
        return;
    // TODO Consider aborting if matches.length is too large.

    const validTextNode = function(node) {
        return matches.find((m) => node.textContent.indexOf(m) > -1)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
    };

    const matchingNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: validTextNode },
        false
    );

    const selectedText = window.getSelection();
    var node;
    while((node = matchingNodes.nextNode())) {
        const txt = node.textContent
          , m = txt.match(re)
          , firstMatch = m[0]
          , lastMatch  = m[m.length - 1]
          , beg = txt.indexOf(firstMatch)
          , end = txt.lastIndexOf(lastMatch) + lastMatch.length
          , range = document.createRange()
          , el = node.parentNode;
        range.setStart(node, beg);
        range.setEnd(node, end);
        selectedText.addRange(range);
        // TODO Some way of cycling through matches ala Cmd/Ctrl-g.
        if(!el.classList.contains(MATCH_SEL_CLASS))
            el.classList.add(MATCH_SEL_CLASS);
    }
}

// Make the regex matched selection visually distinct from regular "Find in page".
function setupSelectionStyle() {
    var sheet = document.head.appendChild(document.createElement('style')).sheet;
    sheet.insertRule(`.${MATCH_SEL_CLASS}::-moz-selection {
        background: green;
    }`, 0);
}

// Slightly hacky way of dropping selection when it is "deselected".
function handleSelectionBlur() {
    // Ideally the 'selectionchange' event would be used here but it doesn't
    // seem to trigger in this case.
    document.addEventListener('click', (e) => {
        if(document.getSelection().isCollapsed)
            for(let el of document.querySelectorAll(`.${MATCH_SEL_CLASS}`))
                el.classList.remove(MATCH_SEL_CLASS);
    });
}
