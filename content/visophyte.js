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

function clamp(aVal, aLow, aHigh) {
  return Math.max(aLow, Math.min(aHigh, aVal));
}

function Color(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = (a === undefined) ? 1.0 : a;
}
Color.prototype = {
  toHSV: function () {
    let h, s, v, r, g, b, vmax, vmin, vdelta, onethird;
    r = this.r / 255.0;
    g = this.g / 255.0;
    b = this.b / 255.0;
    
    vmax = Math.max(r, g, b);
    vmin = Math.min(r, g, b);
    vdelta = vmax - vmin;
    
    onethird = 1.0/3.0;
  
    if (vmax == vmin)
      h = 0.0;
    else if (vmax == r && g >= b)
      h = (g - b)/(vdelta*6.0);
    else if (vmax == r && g < b)
      h = (g - b)/(vdelta*6.0) + 1.0;
    else if (vmax == g)
      h = (b - r)/(vdelta*6.0) + onethird;
    else // vmax == b
      h = (r - g)/(vdelta*6.0) + 2*onethird;
        
    if (vmax == 0)
        s = 0;
    else
        s = 1 - vmin/vmax;
    v = vmax;
    
    return [h, s, v];
  },
  toHSL: function () {
    let h, s, l, r, g, b, vmax, vmin, vdelta, onethird;
    r = this.r / 255.0;
    g = this.g / 255.0;
    b = this.b / 255.0;
    
    vmax = Math.max(r, g, b);
    vmin = Math.min(r, g, b);
    vdelta = vmax - vmin;
    
    onethird = 1.0/3.0;
    
    if (vmax == vmin)
      h = 0.0;
    else if (vmax == r && g >= b)
      h = (g - b)/(vdelta*6.0);
    else if (vmax == r && g < b)
      h = (g - b)/(vdelta*6.0) + 1.0;
    else if (vmax == g)
      h = (b - r)/(vdelta*6.0) + onethird;
    else // vmax == b
      h = (r - g)/(vdelta*6.0) + 2*onethird;
    
    l = 0.5 * (vmax + vmin);
    
    if (l == 0 || vdelta == 0)
        s = 0;
    else if (l <= 0.5)
        s = vdelta / (2 * l);
    else // l > 0.5
        s = vdelta / (2 - 2 * l);
        
    return [h, s, l];
  },
  lighter: function (aStep) {
    if (aStep === undefined)
      aStep = 0.1;
    let [h, s, l] = this.toHSL();
    l = clamp(l + aStep, 0, 1);
    return hsla(h, s, l, this.a);
  },
  brighter: function(aStep) {
    if (aStep === undefined)
      aStep = 0.1;
    let [h, s, v] = this.toHSV();
    v = clamp(v + aStep, 0, 1);
    return hsva(h, s, v, this.a);
  },
  toString: function () {
    return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
  }
}

function wrappy(v) {
  if (v < 0)
    return v + 1.0
  else if (v > 1)
    return v - 1.0;
  else
    return v;
}

function _hsl_Tc(tc, p, q) {
  let Ti = Math.floor(tc * 6);
  let v;
  if (Ti == 0)
    v = p + ((q - p) * 6.0 * tc);
  else if (Ti < 3)
    v = q;
  else if (Ti < 4)
    v = p + ((q - p) * (2.0/3.0 - tc) * 6.0);
  else
    v = p;
  return Math.floor(255 * v);
}

function hsla(hue, saturation, lightness, alpha) {
  let q, p, onethird, Tr, Tg, Tb;
  if (lightness < 0.5)
    q = lightness * (1.0 + saturation);
  else
    q = lightness + saturation - (lightness * saturation);
  p = 2.0 * lightness - q;
  onethird = 1.0/3.0;
  Tr = wrappy(hue + onethird);
  Tg = hue;
  Tb = wrappy(hue - onethird);

  return new Color(_hsl_Tc(Tr,p,q), _hsl_Tc(Tg,p,q), _hsl_Tc(Tb,p,q), alpha);  
}

function hsva(hue, saturation, value, alpha) {
  let Hi, f, p, q, t;
  if (hue >= 1.0)
    hue = 0.0;
  if (saturation < 0.0) {
    let vi = Math.floor(value * 255);
    return new Color(vi, vi, vi, alpha);
  }

  Hi = Math.floor(hue * 6) % 6;
  f = hue * 6 - Hi;
  p = value * (1 - saturation);
  q = value * (1 - f * saturation);
  t = value * (1 - (1 - f) * saturation);
  
  // map into 0-255 space
  value = Math.floor(value * 255);
  p = Math.floor(p * 255);
  q = Math.floor(q * 255);
  t = Math.floor(t * 255);

  if (Hi == 0)
    return new Color(value, t, p, alpha);
  else if (Hi == 1)
    return new Color(q, value, p, alpha);
  else if (Hi == 2)
    return new Color(p, value, t, alpha);
  else if (Hi == 3)
    return new Color(p, q, value, alpha);
  else if (Hi == 4)
    return new Color(t, p, value, alpha);
  else // Hi == 5
    return new Color(value, p, q, alpha);
}

function Vis() {
  /// initial processing only
  this.mappers = [];
  /// behaviours update every rendering pass
  this.behaviours = [];
  /// renderers display the current state
  this.renderers = [];
  /// reactors run based on user activity (hover, click), both in the
  ///  visualization and outside of the visualization.
  this.reactors = [];
  /// track whether all of our renderers have fast hit test mechanisms
  this.hasFastHitTest = true;
}
Vis.prototype = {
  add: function(aThing) {
    if (aThing.map)
      this.mappers.push(aThing);
    if (aThing.behave)
      this.behaviours.push(aThing);
    if (aThing.render) {
      this.renderers.push(aThing);
      if (aThing.fastHitTest == null)
        this.hasFastHitTest = false;
    }
    
    if (aThing.react)
      this.reactors.push(aThing);
  },
  makeContext: function(aData, aDefaults) {
    let context = new VisContext(this, aData, aDefaults);
    return context;
  }
};

function VisContext(aVis, aData, aValues) {
  this.vis = aVis;
  this.data = aData;
  this.phantoms = [];
  for each (let [,item] in Iterator(this.data)) {
    this.phantoms.push({__proto__: item});
  }
  this.valueStack = [aValues];
  this.values = aValues;
  
  this._intervalId = null;
  this._curHover = null;
  
  this.processData(this.vis);
}
VisContext.prototype = {
  processData: function(aVis, aNode) {
    if (aNode)
      this.push(aNode);
    for each (let [,mapper] in Iterator(aVis.mappers)) {
      mapper.map(this);
    }
    if (aNode)
      this.pop();
  },
  push: function(aData) {
    this.values = aData;
    this.valueStack.push(aData);
  },
  pop: function() {
    this.valueStack.pop();
    this.values = this.valueStack[this.valueStack.length-1];
  },
  bindToCanvasNode: function (aCanvasNode, aAdjustLeft, aAdjustTop) {
    this.canvasNode = aCanvasNode;
    this.canvas = aCanvasNode.getContext("2d");
    this.window = aCanvasNode.ownerDocument.defaultView;
    this.reactionsByType = {};
    // TODO: also handle nested visualizations
    for each (let [,reactor] in Iterator(this.vis.reactors)) {
      for each (let [,actionType] in Iterator(reactor.reactsTo)) {
        let reactions = this.reactionsByType[actionType];
        if (reactions === undefined)
          reactions = this.reactionsByType[actionType] = [];
        reactions.push(reactor);
      }
    }
    
    this.canvasNode.setAttribute("visContext", this);
    this.canvasNode.visContext = this;
    
    if (aAdjustLeft === undefined)
      aAdjustLeft = aCanvasNode.width / 2;
    if (aAdjustTop === undefined)
      aAdjustTop = aCanvasNode.height / 2;
    this.canvas.translate(aAdjustLeft, aAdjustTop);
    
    if (!this.render())
      this.animating = true;

    if (this.reactionsByType["click"])
      this.canvasNode.onclick = this._clickEventHandler;
    if (this.reactionsByType["hover"]) {
      this.canvasNode.onmousemove = this._mouseMoveHandler;
      this.canvasNode.onmouseout = this._mouseOutHandler;
    }
  },
  unbindFromCanvasNode: function () {
    if (this.reactionsByType["click"])
      this.canvasNode.onclick = null;
    if (this.reactionsByType["hover"]) {
      this.canvasNode.onmousemove = null;
      this.canvasNode.onmouseout = null;
    }
    
    this.canvas = null;
    this.canvasNode = null;
  },
  animationRate: Math.floor(1000/60),
  set animating(aShouldAnimate) {
    if (aShouldAnimate != this.animating) {
      if (aShouldAnimate) {
        let dis = this;
        this._intervalId = this.window.setInterval(function() {
          if(dis.render())
            dis.animating = false;
        }, this.animationRate);
      }
      else {
        this.window.clearInterval(this._intervalId);
        this._intervalId = null;
      }
    }
  },
  get animating() {
    return this._intervalId != null;
  },
  render: function () {
    let now = Date.now();
    if (this.startStamp === undefined)
      this.startStamp = now;
    this.tdelta = now - this.startStamp;
    if (this.tdelta == 0)
      this.tdelta = 1;
    
    // maybe we should white things out here...
    this.canvas.save();
    this.canvas.setTransform(1, 0, 0, 1, 0, 0);
    let canvasNode = this.canvas.canvas;
    this.canvas.clearRect(0, 0, canvasNode.width, canvasNode.height);
    this.canvas.restore();
    
    this.allDone = true;
    this.subRender(this.vis);
    return this.allDone;
  },
  subRender: function(aVis, aNode) {
    if (aNode)
      this.push(aNode);
    for each (let [,behaviour] in Iterator(aVis.behaviours)) {
      if (!behaviour.behave(this, this.tdelta))
        this.allDone = false;
    }
    for each (let [,renderer] in Iterator(aVis.renderers)) {
      if (!renderer.render(this, this.tdelta))
        this.allDone = false;
    }
    if (aNode)
      this.pop();
  },
  prepHitTest: function(aTestX, aTestY) {
    this.hitTestEnabled = true;
    this.testX = aTestX;
    this.testY = aTestY;
    this.hitNode = null;
  },
  clearHitTest: function() {
    this.hitTestEnabled = false;
    return this.hitNode;
  },
  hitTest: function(aItem) {
    if (!this.hitTestEnabled)
      return;
    this.canvas.save();
    this.canvas.setTransform(1, 0, 0, 1, 0, 0);
    if (this.canvas.isPointInPath(this.testX, this.testY)) {
      this.hitNode = aItem;
    }
    this.canvas.restore();
  },
  fastHitTest: function() {
    for each (let [,renderer] in Iterator(this.vis.renderers)) {
      this.hitNode = renderer.fastHitTest(this);
      if (this.hitNode)
        break;
    }
  },
  _clickEventHandler: function (aEvent) {
    try {
      aEvent.target.visContext.react("click", aEvent, true);
    } catch (ex) {
      dump("Exception in click handler: " + ex.fileName + ":" + ex.lineNumber +
           ": " + ex + "\n");
    }
  },
  _mouseMoveHandler: function (aEvent) {
    try {
      aEvent.target.visContext.react("hover", aEvent, true);
    } catch (ex) {
      dump("Exception in move handler: " + ex + "\n");
    }
  },
  _mouseOutHandler: function (aEvent) {
    try {
      aEvent.target.visContext.react("hover", aEvent, false);
    } catch (ex) {
      dump("Exception in out handler: " + ex + "\n");
    }
  },
  react: function(aAction, aEvent, aDoHitTest, aExplicitTarget) {
    let hitObject = null;
    let x, y;
    if (aDoHitTest) {
      let bounds = this.canvasNode.getBoundingClientRect();
      x = Math.floor(aEvent.clientX - bounds.left);
      y = Math.floor(aEvent.clientY - bounds.top);
      this.prepHitTest(x, y);
      if (this.vis.hasFastHitTest)
        this.fastHitTest();
      else
        this.render();
      hitObject = this.clearHitTest();
    }

    let reactors = this.reactionsByType[aAction];
    let needToRender = false;
    
    if (aAction == "click") {
      // there is nothing to do if nothing was clicked on!
      if (!hitObject) {
        dump("Nothing at: " + x + ", " + y + "\n");
        return;
      }
      for each (let [, reactor] in Iterator(reactors)) {
        if (!reactor.react(this, aAction, undefined, hitObject))
          needToRender = true;
      }
    }
    else if (aAction == "hover") {
      // do nothing if we are already hovering on this node...
      if (this._curHover == hitObject)
        return;
      
      // un-hover the last hovered guy if appropriate
      if (this._curHover) {
        for each (let [, reactor] in Iterator(reactors)) {
          if (!reactor.react(this, aAction, false, this._curHover))
            needToRender = true;
        }
      }
      this._curHover = hitObject;
      // generate the hover event for the new dude
      if (this._curHover) {
        for each (let [, reactor] in Iterator(reactors)) {
          if (!reactor.react(this, aAction, true, this._curHover))
            needToRender = true;
        }
      }
    }
    // everyone else must just use explicit targets... 
    else {
      for each (let [, reactor] in Iterator(reactors)) {
        if (!reactor.react(this, aAction, undefined, aExplicitTarget))
          needToRender = true;
      }
    }
    
    // if we need to render, render.  make sure to set animating if the render
    //  indicates that animation is required.
    if (needToRender && !this.render()) {
      this.animating = true;
    }
  }
};

function LinearNorm(aIn, aOut, aOutLow, aOutHigh, aInLow, aInHigh) {
  this.inAttr = aIn;
  this.outAttr = aOut;
  
  this.outLow = (aOutLow === undefined) ? 0.0 : aOutLow;
  this.outHigh = (aOutHigh === undefined) ? 1.0 : aOutHigh;
  
  this.inLow = aInLow;
  this.inHigh = aInHigh;
}
LinearNorm.prototype = {
  map: function(aVisContext) {
    // normalize the in-space
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let inVal = item[this.inAttr];
      if ((this.inLow == null) || (inVal < this.inLow))
        this.inLow = inVal;
      if ((this.inHigh == null) || (inVal > this.inHigh))
        this.inHigh = inVal;
    }
    
    let inOffset = this.inLow;
    let inSpan = this.inHigh - this.inLow;
    let outOffset = this.outLow;
    let outScale = this.outHigh - this.outLow;
    // normalize to out-space
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let inVal = item[this.inAttr];
      
      item[this.outAttr] = outOffset + outScale * (inVal - inOffset) / inSpan;  
    }
  }
};

function AutoColor(aOutAttr, aSaturation, aValue, aAlpha) {
  this.outAttr = aOutAttr;
  this.saturation = (aSaturation === undefined) ? 0.8 :  aSaturation;
  this.value = (aValue === undefined) ? 0.8 : aValue;
  this.alpha = (aAlpha === undefined) ? 1 : aAlpha;
}
AutoColor.prototype = {
  map: function(aVisContext) {
    let count = aVisContext.phantoms.length;
    for each (let [i, item] in Iterator(aVisContext.phantoms)) {
      item[this.outAttr] = hsva(i / count, this.saturation, this.value,
                                this.alpha);
    }
  }
};

function DistinctColor(aInAttr, aOutAttr, aSaturation, aValue, aAlpha) {
  this.inAttr = aInAttr;
  this.outAttr = aOutAttr;
  this.saturation = (aSaturation === undefined) ? 0.8 :  aSaturation;
  this.value = (aValue === undefined) ? 0.8 : aValue;
  this.alpha = (aAlpha === undefined) ? 1 : aAlpha;
}
DistinctColor.prototype = {
  map: function(aVisContext) {
    let uniqueList = [];
    let uniqueMap = {};
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      let strval = item[this.inAttr].toString();
      if (!(strval in uniqueMap)) {
        uniqueMap[strval] = true;
        uniqueList.push(strval);
      }
    }
    uniqueList.sort();
    let count = uniqueList.length;
    for each (let [i,strval] in Iterator(uniqueList))
      uniqueMap[strval] = hsva(i / count, this.saturation, this.value,
                               this.alpha); 
    
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      let strval = item[this.inAttr].toString();
      item[this.outAttr] = uniqueMap[strval];
    }
  }
}

/// harcoded horizontal for now
function LinearLayout(aNodeVis, aDefaults, aItemOffsetAttr, aItemOffAxisAttr,
    aItemSpacingAttr, aGlobalSpacingAttr) {
  this.nodeVis = aNodeVis;
  this.defaults = aDefaults;
  this.itemOffsetAttr = aItemOffsetAttr;
  this.itemOffAxisAttr = aItemOffAxisAttr;
  this.itemSpacingAttr = aItemSpacingAttr;
  this.globalSpacingAttr = aGlobalSpacingAttr;
}
LinearLayout.prototype = {
  map: function(aVisContext) {
    let offset = 0;
    
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      // set defaults...
      for each (let [key, val] in Iterator(this.defaults))
        item[key] = val;
      aVisContext.processData(this.nodeVis, item);
      
      let halfOffset = aVisContext.values[this.globalSpacingAttr] +
                       item[this.itemSpacingAttr];
      offset += halfOffset;
      item[this.itemOffsetAttr] = offset;
      offset += halfOffset;
    }
  },
  render: function(aVisContext) {
    let ctx = aVisContext.canvas;
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      ctx.save();
      ctx.translate(item[this.itemOffsetAttr] || 0,
                    item[this.itemOffAxisAttr] || 0);
      aVisContext.subRender(this.nodeVis, item);
      ctx.restore();
    }
    return true;
  }
}

function TimeLayout(aNodeVis) {

}
TimeLayout.prototype = {
  map: function(aVisContext) {
    let offset = 0;
    
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      // set defaults...
      for each (let [key, val] in Iterator(this.defaults))
        item[key] = val;
      aVisContext.processData(this.nodeVis, item);
      
      let halfOffset = aVisContext.values[this.globalSpacingAttr] +
                       item[this.itemSpacingAttr];
      offset += halfOffset;
      item[this.itemOffsetAttr] = offset;
      offset += halfOffset;
    }
  },
  render: function(aVisContext) {
    let ctx = aVisContext.canvas;
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      ctx.save();
      ctx.translate(item[this.itemOffsetAttr] || 0,
                    item[this.itemOffAxisAttr] || 0);
      aVisContext.subRender(this.nodeVis, item);
      ctx.restore();
    }
    return true;
  }  
}

function ParentEdgeMaker(aIdAttr, aParentIdAttr, aEdgeAttr, aChildrenAttr) {
  this.idAttr = aIdAttr;
  this.parentIdAttr = aParentIdAttr;
  this.edgeAttr = aEdgeAttr;
  this.childrenAttr = aChildrenAttr;
}
ParentEdgeMaker.prototype = {
  map: function(aVisContext) {
    let idmap = {};
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let id = item[this.idAttr];
      idmap[id] = item;
    }
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let parentId = item[this.parentIdAttr];
      if (parentId) {
        let parent = idmap[parentId];
        item[this.edgeAttr] = parent;
        if (this.childrenAttr) {
          let children = parent[this.childrenAttr];
          if (children === undefined)
            children = parent[this.childrenAttr] = [];
          children.push(item);
        }
      }
    }
  }
}

/// assumes horizontal too
function ArcEdges(aEdgeAttr, aXAttr, aYAttr, aStrokeAttr, aStrokeWidthAttr) {
  this.edgeAttr = aEdgeAttr;
  this.xAttr = aXAttr;
  this.yAttr = aYAttr;
  this.strokeAttr = aStrokeAttr;
  this.strokeWidthAttr = aStrokeWidthAttr;
}
ArcEdges.prototype = {
  render: function(aVisContext, tdelta) {
    let ctx = aVisContext.canvas;
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let other = item[this.edgeAttr];
      
      if (other === undefined)
        continue;
      
      let stroke = item[this.strokeAttr] || aVisContext.values[this.strokeAttr];
      let strokeWidth = item[this.strokeWidthAttr] ||
                        aVisContext.values[this.strokeWidthAttr] || 1;
      ctx.strokeStyle = stroke.toString();
      ctx.lineWidth = strokeWidth;
      
      let mx = (item[this.xAttr] + other[this.xAttr]) / 2;
      let dx = Math.abs(item[this.xAttr] - other[this.xAttr]);
      ctx.beginPath();
      ctx.arc(mx, 0, dx/2, 0, Math.PI, true);
      ctx.stroke();
    }
    return true;
  }
}


function Circle(aFillAttr, aStrokeAttr, aStrokeWidthAttr, aRadiusAttr) {
  this.fillAttr = aFillAttr;
  this.strokeAttr = aStrokeAttr;
  this.strokeWidthAttr = aStrokeWidthAttr;
  this.radiusAttr = aRadiusAttr;
}
Circle.prototype = {
  render: function(aVisContext, tdelta) {
    let ctx = aVisContext.canvas;
  
    let item = aVisContext.values;
    let fill = item[this.fillAttr];
    let stroke = item[this.strokeAttr];
    let radius = item[this.radiusAttr];
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    aVisContext.hitTest(item);
    if (fill) {
      ctx.fillStyle = fill.toString();
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke.toString();
      ctx.lineWidth = item[this.strokeWidthAttr] || 1; 
      ctx.stroke();
    }
    return true;
  }
}

function ExternalToggler(aFirstAction, aSecondAction, aIdAttr, aStashAttr,
    aSettings) {
  this.doAction = aFirstAction;
  this.undoAction = aSecondAction;
  this.reactsTo = [aFirstAction, aSecondAction];
  this.idAttr = aIdAttr;
  this.stashAttr = aStashAttr;
  this.settings = aSettings;
}
ExternalToggler.prototype = {
  react: function(aVisContext, aActionType, aIsHoverEnter, aActionTarget) {
    let needToPaint = false;
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      let id = item[this.idAttr];
      if (id == aActionTarget) {
        needToPaint = true;
        if (aActionType == this.doAction) {
          let stash = {};
          for each (let [key, val] in Iterator(this.settings)) {
            stash[key] = item[key];
            item[key] = val;
          }
          item[this.stashAttr] = stash;
        }
        else {
          let stash = item[this.stashAttr];
          if (stash) {
            for each (let [key, val] in Iterator(stash)) {
              if (val === undefined)
                delete item[key];
              else
                item[key] = val;
            }
            delete item[this.stashAttr];
          }
        }
      }
    }
    return !needToPaint;
  }
};

function ClickCallback(aCallbackThis, aCallbackFunc) {
  this.callbackThis = aCallbackThis;
  this.callbackFunc = aCallbackFunc;
}
ClickCallback.prototype = {
  reactsTo: ["click"],
  react: function(aVisContext, aActionType, aIgnore, aActionTarget) {
    this.callbackFunc.call(this.callbackThis, aActionTarget);
  }
}


function HoverCallback(aCallbackThis, aCallbackFunc) {
  this.callbackThis = aCallbackThis;
  this.callbackFunc = aCallbackFunc;
}
HoverCallback.prototype = {
  reactsTo: ["hover"],
  react: function(aVisContext, aActionType, aIsHoverEnter, aActionTarget) {
    this.callbackFunc.call(this.callbackThis, aActionTarget, aIsHoverEnter);
  }
}

function HoverToggler(aStashAttr, aSettings) {
  this.stashAttr = aStashAttr;
  this.settings = aSettings;
}
HoverToggler.prototype = {
  reactsTo: ["hover"],
  react: function(aVisContext, aActionType, aIsHoverEnter, aActionTarget) {
    let item = aActionTarget;
    if (aIsHoverEnter) {
      let stash = {};
      for each (let [key, val] in Iterator(this.settings)) {
        stash[key] = item[key];
        item[key] = val;
      }
      item[this.stashAttr] = stash;
    }
    else {
      let stash = item[this.stashAttr];
      if (stash) {
        for each (let [key, val] in Iterator(stash)) {
          if (val === undefined)
            delete item[key];
          else
            item[key] = val;
        }
        delete item[this.stashAttr];
      }
    }
    return false;
  }
}

function ConditionalThrobber(aTriggerAttr, aStateAttr, aOutAttr,
    aFromVal, aToVal, aDuration) {
  this.triggerAttr = aTriggerAttr;
  this.stateAttr = aStateAttr;
  this.outAttr = aOutAttr;
  this.fromVal = aFromVal;
  this.toVal = aToVal;
  this.deltaVal = this.toVal - this.fromVal;
  this.duration = aDuration;
  this.halfDuration = aDuration / 2;
}
ConditionalThrobber.prototype = {
  behave: function(aVisContext, tdelta) {
    let allDone = true;
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      let trigger = item[this.triggerAttr];
      let state = item[this.stateAttr];
      // start...
      if (trigger && !state) {
        state = item[this.stateAttr] = tdelta;
      }
      // finish
      if (!trigger && state) {
        delete item[this.stateAttr];
        state = undefined;
        item[this.outAttr] = this.fromVal;
        allDone = false;
      }
      if (state) {
        let cyclePos = (tdelta - state) % this.duration;
        let subCyclePos = cyclePos % this.halfDuration;
        let val;
        // from -> to
        if (cyclePos < this.halfDuration)
          val = this.fromVal + (this.deltaVal * subCyclePos / this.halfDuration);
        // from <- to
        else
          val = this.toVal + (-this.deltaVal * subCyclePos / this.halfDuration);
        item[this.outAttr] = val;
        allDone = false;
      }
    }
    return allDone;
  }
};

function TriggerTween(aActionType, aFollowAttr, aOutAttr,
    aFromVal, aToVal, aDuration, aStateAttr) {
  this.reactsTo = [aActionType];
  this.followAttr = aFollowAttr;
  this.outAttr = aOutAttr;
  this.fromVal = aFromVal;
  this.toVal = aToVal;
  this.deltaVal = this.toVal - this.fromVal;
  this.duration = aDuration;
  this.stateAttr = aStateAttr;
}
TriggerTween.prototype = {
  _follow: function(aItem) {
    let thing = aItem[this.followAttr];
    if (thing == null)
      return [];
    else if (thing instanceof Array)
      return thing;
    else
      return [thing];
  },
  behave: function(aVisContext, tdelta) {
    let allDone = true;
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      if (item[this.stateAttr]) {
        let rdelta = tdelta - item[this.stateAttr];
        if (rdelta > this.duration) {
          item[this.outAttr] = this.toVal;
          delete item[this.stateAttr];
        }
        else {
          item[this.outAttr] = this.fromVal +
                               (this.deltaVal * rdelta / this.duration);
          allDone = false;
        }
      }
    }
    return allDone;
  },
  react: function(aVisContext, aActionType, aActionParam, aActionTarget) {
    for each (let [,item] in Iterator(this._follow(aActionTarget))) {
      item[this.stateAttr] = aVisContext.tdelta;
    }
    // we do need to animate!
    return false;
  }
};

function AnimatedPie(aValueAttr, aRadiusAttr, aTimeSpan) {
  this.valueAttr = aValueAttr;
  this.radiusAttr = aRadiusAttr;
  this.timeSpan = aTimeSpan;
}
AnimatedPie.prototype = {
  map: function(aVisContext) {
    let tally = 0;
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      tally += item[this.valueAttr];
    }
    
    for each (let [, item] in Iterator(aVisContext.phantoms)) {
      // normalize to out-space
      let inVal = item[this.valueAttr];
      let angle = inVal / tally * Math.PI * 2;
      item.pieAngle = angle;
      
      // do color thoughts
      item.fillCenter = item.fill.brighter(0.2).lighter();
      item.fillEdge = item.fill;
    }
  },
  render: function(aVisContext, tdelta) {
    let radius = aVisContext.values[this.radiusAttr];
    let targetAngle = (tdelta / this.timeSpan) * Math.PI * 2;
    let curAngle = 0;
    let ctx = aVisContext.canvas;
    for each (let [,item] in Iterator(aVisContext.phantoms)) {
      if (curAngle >= targetAngle)
        break;
      let availAngle = targetAngle - curAngle;
      
      let pieAngle = item.pieAngle;
      let curRadius;
      let endAngle;
      if (availAngle >= pieAngle) {
        curRadius = radius;
        endAngle = curAngle + pieAngle;
      }
      else {
        curRadius = radius * availAngle / pieAngle;
        endAngle = targetAngle;
      }
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0, curRadius, curAngle, endAngle, false);
      ctx.lineTo(0,0);
      ctx.closePath();
      
      let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, curRadius);
      grad.addColorStop(0.0, item.fillCenter.toString());
      grad.addColorStop(1.0, item.fillEdge.toString());
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.miterLimit = 2;
      ctx.stroke();
      
      //ctx.strokeStyle = item.stroke;
      //ctx.stroke();
      
      curAngle += pieAngle;
    }
    
    let overGrad = ctx.createLinearGradient(0, -radius, 0, radius);
    overGrad.addColorStop(0, "rgba(255,255,255,0.5)");
    overGrad.addColorStop(1, "rgba(255,255,255,0)");
    
    ctx.fillStyle = overGrad;    
    let radiusBorder = Math.max(Math.min(3, Math.floor(radius/5)), 1);
    ctx.beginPath();
    ctx.arc(0, 0, radius - radiusBorder, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    return tdelta > this.timeSpan;
  }
};

function kickIt(aVisContext, aCanvasNode, aCanvasContext,
    aAdjustLeft, aAdjustTop) {
  if (!aVisContext.render(aCanvasContext)) {
    aVisContext.intervalId = 
      window.setInterval(function() {
          if(aVisContext.render(aCanvasContext))
            window.clearInterval(aVisContext.intervalId);
        }, Math.floor(1000 / 60));
  }
}
