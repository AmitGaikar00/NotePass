import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NoteCard({
  item,
  onEdit,
  onDelete,
  viewMode,
  onLongPress,
}) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isGrid = viewMode === "grid";
  const textColor = item.textColor || "#202124";
  const displayDate = item.updatedAt || item.id;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: item.color || "#e8f0fe" },
        isGrid && styles.cardGrid,
      ]}
      onPress={() => onEdit(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {item.images && item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.cardCoverImage} />
      )}

      <View style={styles.cardHeader}>
        <Text
          style={[styles.cardTitle, { color: textColor }]}
          numberOfLines={isGrid ? 2 : 1}
        >
          {item.title}
        </Text>
      </View>

      {/* Shows the giant lock icon instead of the note content */}
      {item.isLocked ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
          }}
        >
          <MaterialIcons
            name="lock"
            size={32}
            color={textColor}
            style={{ opacity: 0.3 }}
          />
          <Text
            style={[
              styles.cardBody,
              { color: textColor, opacity: 0.4, marginTop: 4 },
            ]}
          >
            Locked Note
          </Text>
        </View>
      ) : item.isChecklistMode && item.checklist ? (
        <View style={styles.checklistPreview}>
          {item.checklist.slice(0, 4).map((c) => (
            <View key={c.id} style={styles.checklistItemPreview}>
              <MaterialIcons
                name={c.isChecked ? "check-box" : "check-box-outline-blank"}
                size={18}
                color={textColor}
                style={{ opacity: 0.7 }}
              />

              {/* FIX: Added 'flex: 1' to the text array so it truncates cleanly inside the grid! */}
              <Text
                style={[
                  styles.cardBody,
                  { color: textColor, marginLeft: 6, flex: 1 },
                  c.isChecked && styles.checkedTextPreview,
                ]}
                numberOfLines={1}
              >
                {c.text || "Empty item"}
              </Text>
            </View>
          ))}
          {item.checklist.length > 4 && (
            <Text style={[styles.moreItemsText, { color: textColor }]}>
              + {item.checklist.length - 4} more items
            </Text>
          )}
        </View>
      ) : (
        <Text
          style={[
            styles.cardBody,
            {
              color: textColor,
              fontWeight: item.isBold ? "bold" : "normal",
              fontStyle: item.isItalic ? "italic" : "normal",
            },
          ]}
          numberOfLines={isGrid ? 8 : 4}
        >
          {item.content}
        </Text>
      )}

      <View style={styles.cardFooter}>
        {item.isLocked && (
          <MaterialIcons
            name="lock"
            size={16}
            color="#ea4335"
            style={styles.iconSpacing}
          />
        )}
        {item.isPinned && (
          <MaterialIcons
            name="push-pin"
            size={16}
            color="#1a73e8"
            style={styles.iconSpacing}
          />
        )}
        <Text style={styles.dateText}>{formatDate(displayDate)}</Text>
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
    overflow: "hidden",
  },
  cardGrid: { width: "100%" },
  cardCoverImage: {
    width: "115%",
    height: 120,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    resizeMode: "cover",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: { fontWeight: "800", fontSize: 18, flex: 1 },
  cardBody: { fontSize: 15, lineHeight: 22 },

  // Checklist Preview Layout fixes
  checklistPreview: { marginTop: 2 },
  checklistItemPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  checkedTextPreview: { textDecorationLine: "line-through", opacity: 0.5 },
  moreItemsText: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
    marginTop: 4,
  },

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
