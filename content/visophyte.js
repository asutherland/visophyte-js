
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
  this.mappers = [];
  this.renderers = [];
}
Vis.prototype = {
  add: function(aThing) {
    if (aThing.map)
      this.mappers.push(aThing);
    if (aThing.render)
      this.renderers.push(aThing);
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
  this.values = aValues;
  
  this.processData();
}
VisContext.prototype = {
  processData: function() {
    for each (let [,mapper] in Iterator(this.vis.mappers)) {
      mapper.map(this);
    }
  },
  render: function (aCanvas) {
    let now = Date.now();
    if (this.startStamp === undefined)
      this.startStamp = now;
    let tdelta = now - this.startStamp;
    
    this.canvas = aCanvas;
    
    this.canvas.fillStyle="white";
    this.canvas.beginPath();
    this.canvas.closePath();
    
    let allDone = true;
    for each (let [,renderer] in Iterator(this.vis.renderers)) {
      if (!renderer.render(this, tdelta))
        allDone = false;
    }
    
    return allDone;
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
    for each (let [, item] in aVisContext.phantoms) {
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
    for each (let [, item] in aVisContext.phantoms) {
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
  },
};

function kickIt(aVisContext, aCanvasNode, aCanvasContext) {
  aCanvasContext.translate(aCanvasNode.width/2, aCanvasNode.height/2);
  aVisContext.render(aCanvasContext);
  aVisContext.intervalId = 
    window.setInterval(function() {
        if(aVisContext.render(aCanvasContext))
          window.clearInterval(aVisContext.intervalId);
      }, Math.floor(1000 / 60));
}