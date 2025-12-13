import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

persistent actor WalletAddressBook {
    type WalletEntry = {
        name: Text;
        addedAt: Int;
    };

    // Map from user principal to their address book
    // Each address book maps wallet addresses to wallet entries
    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

    var userAddressBooks = principalMap.empty<OrderedMap.Map<Text, WalletEntry>>();

    // Add or update a wallet address for a specific user
    public func addWalletEntry(userPrincipal : Principal, address : Text, name : Text) : async () {
        let userAddressBook = switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?existingBook) { existingBook };
            case null { textMap.empty<WalletEntry>() };
        };
        
        let now = Time.now();
        // If entry exists, preserve the original addedAt time, otherwise use now
        let entry = switch (textMap.get(userAddressBook, address)) {
            case (?existingEntry) { 
                { name = name; addedAt = existingEntry.addedAt }
            };
            case null { 
                { name = name; addedAt = now }
            };
        };
        
        let updatedAddressBook = textMap.put(userAddressBook, address, entry);
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
    public query func getUserWallets(userPrincipal : Principal) : async [(Text, Text, Int)] {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                let entries = Iter.toArray(textMap.entries(userAddressBook));
                Array.map<(Text, WalletEntry), (Text, Text, Int)>(entries, func((address, entry)) {
                    (address, entry.name, entry.addedAt)
                })
            };
            case null { [] };
        };
    };

    // Search wallet entries for a specific user
    public query func searchUserWallets(userPrincipal : Principal, searchTerm : Text) : async [(Text, Text, Int)] {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                let entries = textMap.entries(userAddressBook);
                let filtered = Array.filter<(Text, WalletEntry)>(
                    Iter.toArray(entries),
                    func((address, entry)) {
                        Text.contains(address, #text searchTerm) or Text.contains(entry.name, #text searchTerm);
                    },
                );
                Array.map<(Text, WalletEntry), (Text, Text, Int)>(filtered, func((address, entry)) {
                    (address, entry.name, entry.addedAt)
                })
            };
            case null { [] };
        };
    };

    // Get a specific wallet entry for a user
    public query func getWalletEntry(userPrincipal : Principal, address : Text) : async ?(Text, Int) {
        switch (principalMap.get(userAddressBooks, userPrincipal)) {
            case (?userAddressBook) {
                switch(textMap.get(userAddressBook, address)) {
                    case (?entry) { ?(entry.name, entry.addedAt) };
                    case null { null };
                }
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
                    case (?oldEntry) {
                        let newEntry = { name = newName; addedAt = oldEntry.addedAt };
                        let updatedAddressBook = textMap.put(userAddressBook, address, newEntry);
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