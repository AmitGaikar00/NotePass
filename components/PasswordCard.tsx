import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PasswordCard({ item, onEdit, onDelete }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {/* Title now has the entire width */}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.site}
        </Text>
      </View>

      <Text style={styles.cardBody}>User: {item.username}</Text>

      {/* V3: Metadata moved to the bottom right */}
      <View style={styles.cardFooter}>
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
    backgroundColor: "#e8f0fe",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "800", fontSize: 18, color: "#202124", flex: 1 },
  cardBody: {
    fontSize: 15,
    color: "#3c4043",
    fontWeight: "500",
    marginBottom: 2,
  },

  // V3 Styles for the new bottom-right footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
  dateText: { fontSize: 12, color: "#5f6368", fontWeight: "600" },
  deleteBtn: { padding: 4, marginLeft: 6, marginRight: -4 },
});
