import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NoteCard({ item, onEdit, onDelete, viewMode }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isGrid = viewMode === "grid";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: item.color || "#e8f0fe" },
        isGrid && styles.cardGrid,
      ]}
      onPress={() => onEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={isGrid ? 2 : 1}>
          {item.title}
        </Text>

        <View style={styles.headerRight}>
          {item.isPinned && (
            <MaterialIcons
              name="push-pin"
              size={16}
              color="#1a73e8"
              style={styles.iconSpacing}
            />
          )}
          <Text style={styles.dateText}>{formatDate(item.id)}</Text>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={styles.deleteBtn}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FIX: Set numberOfLines to undefined in grid mode so it expands to fit all content! */}
      <Text style={styles.cardBody} numberOfLines={isGrid ? undefined : 4}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    width: "100%",
  },

  // FIX: In Masonry layout, the column handles the width, so the card just needs to take 100% of its column
  cardGrid: { width: "100%" },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#202124",
    flex: 1,
    marginRight: 5,
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconSpacing: { marginRight: 5 },
  dateText: { fontSize: 12, color: "#5f6368", fontWeight: "600" },
  deleteBtn: { padding: 4, marginLeft: 4, marginRight: -4 },
  cardBody: {
    fontSize: 15,
    color: "#3c4043",
    lineHeight: 22,
    fontWeight: "500",
  },
});
