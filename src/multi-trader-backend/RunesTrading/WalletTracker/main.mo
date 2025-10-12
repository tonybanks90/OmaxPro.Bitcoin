import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

persistent actor WalletAddressBook {
    // Map from user principal to their address book
    // Each address book maps wallet addresses to wallet names
    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

    var userAddressBooks = principalMap.empty<OrderedMap.Map<Text, Text>>();

    // Add or update a wallet address for a specific user
    public func addWalletEntry(userPrincipal : Principal, address : Text, name : Text) : async () {
        let userAddressBook = switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?existingBook) { existingBook };
            case null { textMap.empty<Text>() };
            
        };
        
        let updatedAddressBook = textMap.put(userAddressBook, address, name);
        userAddressBooks := principalMap.put(userAddressBooks, userPrincipal, updatedAddressBook);
    };

    // Remove a wallet address for a specific user
    public func removeWalletEntry(userPrincipal : Principal, address : Text) : async Bool {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                let (updatedAddressBook, removed) = textMap.remove(userAddressBook, address);
                userAddressBooks := principalMap.put(userAddressBooks, userPrincipal, updatedAddressBook);
                switch (removed) {
                    case (?_) { true };
                    case null { false };
                };
            };
            case null { false };
        };
    };

    // Get all wallet entries for a specific user
    public query func getUserWallets(userPrincipal : Principal) : async [(Text, Text)] {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                Iter.toArray(textMap.entries(userAddressBook));
            };
            case null { [] };
        };
    };

    // Search wallet entries for a specific user
    public query func searchUserWallets(userPrincipal : Principal, searchTerm : Text) : async [(Text, Text)] {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                let entries = textMap.entries(userAddressBook);
                let results = Array.filter<(Text, Text)>(
                    Iter.toArray(entries),
                    func((address, name)) {
                        Text.contains(address, #text searchTerm) or Text.contains(name, #text searchTerm);
                    },
                );
                results;
            };
            case null { [] };
        };
    };

    // Get a specific wallet entry for a user
    public query func getWalletEntry(userPrincipal : Principal, address : Text) : async ?Text {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                textMap.get(userAddressBook, address);
            };
            case null { null };
        };
    };

    // Get total number of wallets for a user
    public query func getUserWalletCount(userPrincipal : Principal) : async Nat {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                textMap.size(userAddressBook);
            };
            case null { 0 };
        };
    };

    // Update wallet name for a user
    public func updateWalletName(userPrincipal : Principal, address : Text, newName : Text) : async Bool {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                switch (textMap.get(userAddressBook, address)) {
                    case (?_) {
                        let updatedAddressBook = textMap.put(userAddressBook, address, newName);
                        userAddressBooks := principalMap.put(userAddressBooks, userPrincipal, updatedAddressBook);
                        true;
                    };
                    case null { false };
                };
            };
            case null { false };
        };
    };
}