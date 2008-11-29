function GlodaThreader(aEdgeAttr) {
  this.edgeAttr = aEdgeAttr;
}
GlodaThreader.prototype = {
  map: function(aVisContext) {
    let messageIdMap = {};
    dump("mapping parent edges\n")
    for each (let [, message] in Iterator(aVisContext.phantoms)) {
      messageIdMap[message.headerMessageID] = message;
      dump("mapping " + message + " via " + message.headerMessageID + "\n");
    }
    // now find their closest parent...
    for each (let message in messageIdMap) {
      let msgHdr = message.folderMessage;
      // references are ordered from old (0) to new (n-1), so walk backwards
      for (let iRef = msgHdr.numReferences-1; iRef >= 0; iRef--) {
        let ref = msgHdr.getStringReference(iRef);
        dump(" looking for: " + ref + "\n");
        if (ref in messageIdMap) {
          // link them to their parent
          message[this.edgeAttr] = messageIdMap[ref];
          dump(" +found it!\n");
          break; 
        }
      }
    }
  }
}
