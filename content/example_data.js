var nextIdentityId = 1;
function Identity(aAddress) {
  this.id = nextIdentityId++;
  this.kind = "email";
  this.value = aAddress;
}

var identities = [
  new Identity("alice@wonderland.nul"),
  new Identity("bob@whataboot.nul"),
  new Identity("chuck@cheese.nul"),
  new Identity("dee@te.edu")
];

var nextContactId = 1;
function Contact(aName, aIdentities) {
  this.id = nextContactId++;
  this.name = aName;
  this.identities = aIdentities;
}

var contacts = [
  new Contact("Alice", [identities[0]]),
  new Contact("Bob", [identities[1]]),
  new Contact("Chuck", [identities[2]]),
  new Contact("Dee", [identities[3]])
];

var nextConversationId = 1;
function Conversation(aSubject) {
  this.id = nextConversationId++;
  this.aSubject = aSubject;
}

var conversations = [
  new Conversation("Funkytown"),
  new Conversation("Giant robots"),
  new Conversation("Laser monkeys"),
  new Conversation("Jacob & Ian")
];

var nextMessageId;
function Message(aInReplyToId, aDate, aConversation, aFrom, aToList) {
  this.id = nextMessageId++;
  this.inReplyToId = aInReplyToId;
  this.date = aDate;
  this.conversation = aConversation;
  this.from = aFrom;
  this.to = aToList;
}

var messages = [
  // conv 0 : id's 1-4
  new Message(null, new Date(2008,  1,  1, 10,  0), conversations[0],
      identities[0], [identities[0], identities[1]]),
  new Message(   1, new Date(2008,  1,  1, 10, 17), conversations[0],
      identities[1], [identities[0], identities[2]]),
  new Message(   2, new Date(2008,  1,  1, 10, 53), conversations[0],
      identities[2], [identities[0], identities[1]]),
  new Message(   3, new Date(2008,  1,  1, 12, 12), conversations[0],
      identities[0], [identities[0], identities[1]]),
  // conv 1: id's 5-6
  new Message(   1, new Date(2008,  1,  1, 15,  7), conversations[1],
      identities[0], [identities[1]]),
  new Message(   1, new Date(2008,  1,  1, 19, 10), conversations[1],
      identities[1], [identities[0]]),
  // conv 2: id's 7-7
  new Message(null, new Date(2008,  1,  1, 20,  8), conversations[2],
      identities[2], [identities[0]]),
  // conv 3: id's 8-15
  new Message(null, new Date(2008,  1,  2,  8,  3), conversations[3],
      identities[3], identities),
  new Message(   8, new Date(2008,  1,  2, 12, 10), conversations[3],
      identities[2], identities),
  new Message(   8, new Date(2008,  1,  2, 15, 19), conversations[3],
      identities[0], identities),
  new Message(  10, new Date(2008,  1,  2, 19, 48), conversations[3],
      identities[1], identities),
  new Message(  11, new Date(2008,  1,  2, 19, 58), conversations[3],
      identities[0], identities),
  new Message(   9, new Date(2008,  1,  3, 13, 22), conversations[3],
      identities[3], identities),
  new Message(  13, new Date(2008,  1,  3, 17, 41), conversations[3],
      identities[2], identities),
  new Message(  10, new Date(2008,  1,  3, 22, 30), conversations[3],
      identities[1], identities),
];