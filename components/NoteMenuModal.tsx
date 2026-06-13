import { MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NoteMenuModal({
  note,
  onClose,
  onToggleProperty,
  onDelete,
}) {
  if (!note) return null;

  const handleLockToggle = async () => {
    if (note.isLocked) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify identity to unlock",
      });
      if (auth.success) onToggleProperty(note.id, "isLocked", false);
    } else {
      onToggleProperty(note.id, "isLocked", true);
    }
    onClose();
  };

  return (
    <Modal
      visible={!!note}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Prevent taps inside the menu from closing the modal */}
        <TouchableOpacity activeOpacity={1} style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Note Options</Text>

          <View style={styles.menuList}>
            {/* Lock Button */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLockToggle}
            >
              <MaterialIcons
                name={note.isLocked ? "lock-open" : "lock"}
                size={28}
                color="#202124"
                style={styles.iconMargin}
              />
              <Text style={styles.menuItemText}>
                {note.isLocked ? "Unlock Note" : "Lock Note"}
              </Text>
            </TouchableOpacity>

            {/* Pin Button */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onToggleProperty(note.id, "isPinned", !note.isPinned);
                onClose();
              }}
            >
              <MaterialIcons
                name="push-pin"
                size={28}
                color={note.isPinned ? "#1a73e8" : "#202124"}
                style={styles.iconMargin}
              />
              <Text style={styles.menuItemText}>
                {note.isPinned ? "Unpin Note" : "Pin Note"}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onDelete(note.id);
                onClose();
              }}
            >
              <MaterialIcons
                name="delete-outline"
                size={28}
                color="#ea4335"
                style={styles.iconMargin}
              />
              <Text style={[styles.menuItemText, { color: "#ea4335" }]}>
                Delete Note
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#ffffff",
    width: "70%",
    borderRadius: 20,
    paddingVertical: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#202124",
    marginBottom: 15,
    paddingHorizontal: 25,
  },
  menuList: {
    width: "100%",
  },
  menuItem: {
    flexDirection: "row", // Places icon and text side-by-side
    alignItems: "center", // Vertically centers them
    paddingVertical: 14,
    paddingHorizontal: 25,
  },
  iconMargin: {
    marginRight: 16, // Adds space between the icon and the text
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
  },
});
