/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is visophyte-js.
 *
 * The Initial Developer of the Original Code is
 * Andrew Sutherland <asutherland@asutherland.org>.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

const NEIGHBOR_SIGNS = [
  [0, 1], // north
  [1, 1], // north-east
  [1, 0], // east
  [1, -1], // south-east
  [0, -1], // south
  [-1, -1], // south-west
  [-1, 0], // west
  [-1, 1] // north-west
];
const DIR_SELF = -1;
const DIR_PREF_PERP = [true, false, true, false, true, false, true, false];
const OPPOSITE_DIR = 4;
const NDIRECTIONS = NEIGHBOR_SIGNS.length;
const DEFAULT_NEIGHBOR_STATE = [undefined, undefined, undefined, undefined,
  undefined, undefined, undefined, undefined, undefined];
const GRID_SIZE = 2;

const FONT_STRING = "px sans-serif";

function NRect() {
  Rect.apply(this, arguments);
}
NRect.prototype = {
  __proto__: Rect.prototype,
  // ====== Wacky Neighbor Logix =====
  getPointNeighborDir: function(x, y) {
    let qx, qy;
    if (x < this.x)
      qx = -1;
    else if (x > (this.x + this.w))
      qx = 1;
    else
      qx = 0;
    if (y < this.y)
      qy = 1;
    else if (y > (this.y + this.h))
      qy = -1;
    else
      qy = 0;
    
    if (!qx && !qy)
      return DIR_SELF;
    for (let iNeighbor = 0; iNeighbor < NEIGHBOR_SIGNS.length; iNeighbor++) {
      let [nx, ny] = NEIGHBOR_SIGNS[iNeighbor];
      if ((nx == qx) && (ny == qy))
        return iNeighbor;
    }
  },
  placeNeighborly: function(containingBox, neighborDir) {
    let [qx, qy] = NEIGHBOR_SIGNS[neighborDir];
    if (qx == 1) {
      this.x = containingBox.x;
    }
    else if (qx == 0) {
      // in theory we could do some wiggling here...
      this.centerX = containingBox.centerX;
    }
    else { // qx == -1
      this.right = containingBox.right;
    }
    let y, height;
    if (qy == 1) {
      this.bottom = containingBox.bottom;
    }
    else if (qy == 0) {
      // wiggling conceivable
      this.centerY = containingBox.centerY;
    }
    else { // qy == -1
      this.y = containingBox.y;
    }
  },
  /**
   * Treating this rectangle as the rectangle defining the center square in
   *  a tic-tac-toe grid, figure out the rectangle remaining from the provided
   *  
   */
  ticTacToeSlice: function(gridRect, neighborDir) {
    let [qx, qy] = NEIGHBOR_SIGNS[neighborDir];
    let x, width;
    if (qx == 1) {
      x = this.right;
      width = gridRect.right - x;
    }
    else if (qx == 0) {
      x = this.x;
      width = this.w;
    }
    else { // qx == -1
      x = gridRect.x;
      width = this.x - x;
    }
    let y, height;
    if (qy == 1) {
      y = gridRect.y;
      height = this.y - y;
    }
    else if (qy == 0) {
      y = this.y;
      height = this.h;
    }
    else { // qy == -1
      y = this.bottom;
      height = gridRect.bottom - y;
    }
    return new Rect(x, y, width, height);
  }
};

function FancyBox(aboveLines) {
  // er, let's ignore the aboveLines now since we don't use them
}
FancyBox.prototype = {
};

function WordBox(aPuzzle, aPhantom, aWord, aSize) {
  this.puzzle = aPuzzle;
  this.phantom = aPhantom;
  this.word = aWord;
  this.size = aSize;
  
  this.neighbors = DEFAULT_NEIGHBOR_STATE.concat();
  this.parentDir = null;
  this.nextNeighborDispatch = 0;
  
  this.containedWords = [];
  
  // domain of control, what is the bounding box what we are in charge of.
  this.controlBox = null;
  // what is the bounding box containing our word
  this.selfBox = null;
  // what is the fancy box containing our word
  this.selfFox = null;
  
  this.boundSelf();
  this.rotated = false;
}
WordBox.prototype = {
  boundSelf: function() {
    let ctx = this.puzzle.canvas;
    ctx.font = this.size + FONT_STRING;
    let width = ctx.measureText(this.word).width;
    // make sure to clear out the previous path!
    ctx.beginPath();
    ctx.mozPathText(this.word);
    dump("word '" + this.word + "' width: " + width + "\n");
    
    let gridXSteps = Math.floor((width + (GRID_SIZE - 1))/ GRID_SIZE);
    let gridWidth = gridXSteps * GRID_SIZE;
    
    dump("grid width: " + gridWidth + "\n");
    
    let aboveLines = [];
    let allowedFailedHits = 4;
    let highestY = 0;
    for (let y = 0; ; y -= GRID_SIZE) {
      let hitAnyThisLine = false;
      let hitsThisLine = [];
      for (let x = 0; x < gridWidth; x += GRID_SIZE) {
        if (ctx.isPointInPath(x, y)) {
          hitAnyThisLine = true;
          hitsThisLine.push(true);
        }
        else
          hitsThisLine.push(false);
      }
      if (hitAnyThisLine) {
        aboveLines.push(hitsThisLine);
        highestY = y;
        //!dump([(z ? "x" : " ") for each (z in hitsThisLine)].join("") + "\n");
      }
      else {
        //!dump("...\n");
        aboveLines.push(false);
        if (--allowedFailedHits == 0)
          break;
      }
    }
    // nuke the fully empty above lines
    aboveLines.splice((highestY / -GRID_SIZE) + 1);
    
    this.selfBox = new NRect(0, 0, gridWidth, -highestY);
    this.selfFox = new FancyBox(aboveLines);
        
    dump("bounded " + this.word + " to " + this.selfBox + "\n");
  },
  _findOpenNeighbor: function(startNeighbor) {
    for (let iNeighbor = startNeighbor || 0; iNeighbor < NEIGHBOR_SIGNS.length;
         iNeighbor++) {
      let neighbor = this.neighbors[iNeighbor];
      if (neighbor === undefined)
        return iNeighbor;
    }
    return false;
  },
  _findPresentNeighbor: function(startNeighbor) {
    if (startNeighbor === undefined)
      startNeighbor = 0;
    let endNeighbor = (startNeighbor + NDIRECTIONS - 1) % NDIRECTIONS;
    for (let iNeighbor = startNeighbor; iNeighbor != endNeighbor;
        iNeighbor = (iNeighbor+1) % NDIRECTIONS) {
     let neighbor = this.neighbors[iNeighbor];
     if (neighbor != null)
       return iNeighbor;
    }
    return false;
  },
  addWord: function(aWord, startNeighbor) {
    let iNeighbor = this._findOpenNeighbor(startNeighbor);
    if (iNeighbor !== false) {
      // figure out how much space we have for that dude
      let neighborBounds = this.selfBox.ticTacToeSlice(this.controlBox,
                                                       iNeighbor);
      if (aWord.selfBox.fitsIn(neighborBounds)) {
        // we have to rotate if we don't fit normal, but also try if...
        // it's amusing and we could fit rotated.
        if (!aWord.selfBox.fitsNormal(neighborBounds) ||
            (!this.rotated && aWord.selfBox.fitsRotated(neighborBounds))) {
          aWord.rotate();
        }
        
        aWord.setParent(this, iNeighbor);
        aWord.goControl(neighborBounds, iNeighbor);
        this.neighbors[iNeighbor] = aWord;
        dump(this.word + " placed " + aWord.word + " in dir " + iNeighbor +
             ": " + aWord.selfBox + " controlling " + neighborBounds + "\n");
        return true;
      }
      else {
        dump("(" + this.word + " could not fit " + aWord.word + " in dir " +
             iNeighbor + ": " + aWord.selfBox + " did not fit in " +
             neighborBounds + "\n");
        // permanently null this guy out if there will never be enough space
        if (neighborBounds.minDimVal < 6) {
          this.neighbors[iNeighbor] = null;
          dump("[permanently nulling out that direction]\n");
        }
        return this.addWord(aWord, iNeighbor+1);
      }
    }
    iNeighbor = this._findPresentNeighbor(this.nextNeighborDispatch);
    if (iNeighbor !== false) {
      this.nextNeighborDispatch = (iNeighbor + 1) % NDIRECTIONS;
      let neighbor = this.neighbors[iNeighbor];
      return neighbor.addWord(aWord);
    }
  },
  render: function (ctx) {
    ctx.save();
    if (this.rotated) {
      ctx.translate(this.selfBox.x + this.selfBox.w, this.selfBox.bottom);
      ctx.rotate(-Math.PI / 2);
    }
    else
      ctx.translate(this.selfBox.x, this.selfBox.bottom);
    ctx.font = this.size + FONT_STRING;
    let fill = this.phantom[this.puzzle.fillAttr].toString();
    ctx.fillStyle = fill;
    ctx.fillText(this.word, 0, 0);
    //ctx.lineWidth = 0.5;
    //ctx.strokeStyle = fill;
    //ctx.strokeText(this.word, 0, 0);
    ctx.restore();
    
    let visContext = this.puzzle.visContext;
    if (visContext.hitTestEnabled) {
      if (this.selfBox.containsPoint(visContext.testX, visContext.testY))
        visContext.hitNode = this.phantom;
    }
    
    for (let iNeighbor = 0; iNeighbor < NEIGHBOR_SIGNS.length; iNeighbor++) {
      let neighbor = this.neighbors[iNeighbor];
      if (neighbor != null)
        neighbor.render(ctx);
    }    
  },
  fastHitTest: function(aVisContext) {
    let dir = this.selfBox.getPointNeighborDir(aVisContext.testX, aVisContext.testY);
    if (dir == DIR_SELF)
      return this.phantom;
    let neighbor = this.neighbors[dir]; 
    if (neighbor)
      return neighbor.fastHitTest(aVisContext);
    else
      return null;
  },
  placeCenterAt: function (cx, cy) {
    this.selfBox.centerX = cx;
    this.selfBox.centerY = cy;
  },
  rotate: function() {
    this.rotated = true;
    this.selfBox.rotate();
  },
  goControl: function (controlBox, parentDirToUs) {
    this.controlBox = controlBox;
    this.selfBox.placeNeighborly(controlBox, parentDirToUs);
  },
  /**
   * Set the parent and direction info.
   */
  setParent: function(aParent, aParentDirToUs) {
    this.parentDir = (aParentDirToUs + OPPOSITE_DIR) % NDIRECTIONS;
    // we're avoiding cycles...
    this.neighbors[this.parentDir] = null;
    // and null out the adjacent directions too
    this.neighbors[(this.parentDir + 7) % NDIRECTIONS] = null;
    this.neighbors[(this.parentDir + 1) % NDIRECTIONS] = null;
  },
};

function WordCloud(aWordAttr, aPopularityAttr, aFillAttr) {
  this.wordAttr = aWordAttr;
  this.popularityAttr = aPopularityAttr;
  this.fillAttr = aFillAttr;
  
  this.rootWord = null;
  this.puzzle = {};
}
WordCloud.prototype = {
  _wordDescendingSorter: function (a, b) {
    return b[this.popularityAttr] - a[this.popularityAttr];
  },
  map: function (aVisContext) {
    // -- prep
    let orderedWordList = aVisContext.phantoms.concat();
    // and sort them so the most popular words come first
    orderedWordList.sort(this._wordDescendingSorter);
    
    this.orderedWordList = orderedWordList;
  },
  layout: function (aVisContext) {
    let puzzle = this.puzzle = {
      visContext: aVisContext, canvas: aVisContext.canvas,
      wordAttr: this.wordAttr, popularityAttr: this.popularityAttr,
      fillAttr: this.fillAttr};
    
    // -- first pass, size all the words
    let wordBoxes = [];
    for each (let [, item] in Iterator(this.orderedWordList)) {
      let size = item[this.popularityAttr] * 2 + 8;
      
      wordBoxes.push(new WordBox(puzzle, item, item[this.wordAttr], size));
    }

    // -- second pass, actually layout!
    let iWordBoxes = Iterator(wordBoxes);
    this.rootWord = iWordBoxes.next()[1];
    this.rootWord.controlBox = new NRect(0, 0,
        aVisContext.canvasNode.width, aVisContext.canvasNode.height);
    this.rootWord.placeCenterAt(Math.floor(aVisContext.canvasNode.width / 2),
        Math.floor(aVisContext.canvasNode.height / 2));
    
    for each (let [, wordBox] in iWordBoxes) {
      this.rootWord.addWord(wordBox);
    }

  },
  render: function(aVisContext) {
    let ctx = aVisContext.canvas;
    ctx.textAlign = "left";
    
    if (this.rootWord == null)
      this.layout(aVisContext);
    
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    this.rootWord.render(ctx);
    
    return true;
  },
  fastHitTest: function(aVisContext) {
    return this.rootWord.fastHitTest(aVisContext);
  }
};
