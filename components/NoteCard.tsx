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
        {/* Title now has the entire width of the card */}
        <Text style={styles.cardTitle} numberOfLines={isGrid ? 2 : 1}>
          {item.title}
        </Text>
      </View>

      {/* V3: Fixed masonry height - limits to 8 lines instead of infinite */}
      <Text style={styles.cardBody} numberOfLines={isGrid ? 8 : 4}>
        {item.content}
      </Text>

      {/* V3: Metadata moved to the bottom right */}
      <View style={styles.cardFooter}>
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
  cardGrid: { width: "100%" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: { fontWeight: "800", fontSize: 18, color: "#202124", flex: 1 },
  cardBody: {
    fontSize: 15,
    color: "#3c4043",
    lineHeight: 22,
    fontWeight: "500",
  },

  // V3 Styles for the new bottom-right footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
  },
  iconSpacing: { marginRight: 6 },
  dateText: { fontSize: 12, color: "#5f6368", fontWeight: "600" },
  deleteBtn: { padding: 4, marginLeft: 6, marginRight: -4 },
});
