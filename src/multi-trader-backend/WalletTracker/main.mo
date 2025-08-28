import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

persistent actor {
    transient let textMap = OrderedMap.Make<Text>(Text.compare);

    var addressBook = textMap.empty<Text>();

    public func addEntry(address : Text, name : Text) : async () {
        addressBook := textMap.put(addressBook, address, name);
    };

    public query func getAllEntries() : async [(Text, Text)] {
        Iter.toArray(textMap.entries(addressBook));
    };

    public query func searchEntries(searchTerm : Text) : async [(Text, Text)] {
        let entries = textMap.entries(addressBook);
        let results = Array.filter<(Text, Text)>(
            Iter.toArray(entries),
            func((address, name)) {
                Text.contains(address, #text searchTerm) or Text.contains(name, #text searchTerm);
            },
        );
        results;
    };
};