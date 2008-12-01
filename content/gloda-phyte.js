function GlodaThreader(aEdgeAttr, aChildrenAttr) {
  this.edgeAttr = aEdgeAttr;
  this.childrenAttr = aChildrenAttr;
}
GlodaThreader.prototype = {
  map: function(aVisContext) {
    let messageIdMap = {};
    for each (let [, message] in Iterator(aVisContext.phantoms)) {
      messageIdMap[message.headerMessageID] = message;
    }
    // now find their closest parent...
    for each (let message in messageIdMap) {
      let msgHdr = message.folderMessage;
      // references are ordered from old (0) to new (n-1), so walk backwards
      for (let iRef = msgHdr.numReferences-1; iRef >= 0; iRef--) {
        let ref = msgHdr.getStringReference(iRef);
        if (ref in messageIdMap) {
          // link them to their parent
          let parent = messageIdMap[ref];
          message[this.edgeAttr] = parent;
          if (this.childrenAttr) {
            let children = parent[this.childrenAttr];
            if (children === undefined)
              children = parent[this.childrenAttr] = [];
            children.push(message);
          }
          break; 
        }
      }
    }
  }
}
