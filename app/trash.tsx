import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrashScreen() {
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [trashedPasswords, setTrashedPasswords] = useState([]);
  const [activeTab, setActiveTab] = useState("notes"); // 'notes' | 'passwords'

  useFocusEffect(
    useCallback(() => {
      loadTrash();
    }, []),
  );

  const loadTrash = async () => {
    try {
      const n = await AsyncStorage.getItem("@my_notes");
      if (n) setTrashedNotes(JSON.parse(n).filter((item) => item.isTrashed));
      else setTrashedNotes([]);

      const p = await SecureStore.getItemAsync("my_passwords");
      if (p)
        setTrashedPasswords(JSON.parse(p).filter((item) => item.isTrashed));
      else setTrashedPasswords([]);
    } catch (e) {
      console.log("Load trash error:", e);
    }
  };

  const handleRestore = async (id, type) => {
    try {
      if (type === "notes") {
        const data = await AsyncStorage.getItem("@my_notes");
        const allNotes = data ? JSON.parse(data) : [];
        const updated = allNotes.map((n) =>
          n.id === id ? { ...n, isTrashed: false } : n,
        );
        await AsyncStorage.setItem("@my_notes", JSON.stringify(updated));
      } else {
        const data = await SecureStore.getItemAsync("my_passwords");
        const allPass = data ? JSON.parse(data) : [];
        const updated = allPass.map((p) =>
          p.id === id ? { ...p, isTrashed: false } : p,
        );
        await SecureStore.setItemAsync("my_passwords", JSON.stringify(updated));
      }
      loadTrash();
    } catch (error) {
      console.log("Restore error:", error);
    }
  };

  const executePermanentDelete = async (id, type) => {
    try {
      if (type === "notes") {
        const data = await AsyncStorage.getItem("@my_notes");
        const allNotes = data ? JSON.parse(data) : [];
        const filtered = allNotes.filter((n) => n.id !== id);
        await AsyncStorage.setItem("@my_notes", JSON.stringify(filtered));
      } else {
        const data = await SecureStore.getItemAsync("my_passwords");
        const allPass = data ? JSON.parse(data) : [];
        const filtered = allPass.filter((p) => p.id !== id);
        await SecureStore.setItemAsync(
          "my_passwords",
          JSON.stringify(filtered),
        );
      }
      loadTrash();
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const handlePermanentDelete = (id, type) => {
    Alert.alert("Delete Forever?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => executePermanentDelete(id, type),
      },
    ]);
  };

  const executeEmptyTrash = async () => {
    try {
      if (activeTab === "notes") {
        const data = await AsyncStorage.getItem("@my_notes");
        const allNotes = data ? JSON.parse(data) : [];
        await AsyncStorage.setItem(
          "@my_notes",
          JSON.stringify(allNotes.filter((n) => !n.isTrashed)),
        );
      } else {
        const data = await SecureStore.getItemAsync("my_passwords");
        const allPass = data ? JSON.parse(data) : [];
        await SecureStore.setItemAsync(
          "my_passwords",
          JSON.stringify(allPass.filter((p) => !p.isTrashed)),
        );
      }
      loadTrash();
    } catch (error) {
      console.log("Empty trash error:", error);
    }
  };

  const emptyTrash = () => {
    Alert.alert(
      "Empty Entire Trash?",
      `This will permanently delete all trashed ${activeTab}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Empty",
          style: "destructive",
          onPress: () => executeEmptyTrash(),
        },
      ],
    );
  };

  // NEW: Formatter for the deletion date
  const formatDeletionDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const d = new Date(parseInt(timestamp));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderTrashItem = ({ item }) => (
    <View style={styles.trashCard}>
      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {activeTab === "notes" ? item.title : item.site}
        </Text>
        <Text style={styles.subText} numberOfLines={1}>
          {activeTab === "notes" ? item.content : item.username}
        </Text>

        {/* NEW: Displays the date of deletion below item info */}
        <Text style={styles.deletedAtText}>
          Deleted: {formatDeletionDate(item.deletedAt)}
        </Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => handleRestore(item.id, activeTab)}
          style={styles.iconBtn}
        >
          <MaterialIcons name="restore" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePermanentDelete(item.id, activeTab)}
          style={[styles.iconBtn, { backgroundColor: "#ffebe9" }]}
        >
          <MaterialIcons name="delete-forever" size={24} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const displayData = activeTab === "notes" ? trashedNotes : trashedPasswords;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Trash</Text> */}
        {/* {displayData.length > 0 && ( */}
          <TouchableOpacity onPress={emptyTrash} style={styles.emptyBtn}>
            <Text style={styles.emptyText}>Empty All</Text>
          </TouchableOpacity>
        {/* )} */}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notes" && styles.activeTab]}
          onPress={() => setActiveTab("notes")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "notes" && styles.activeTabText,
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "passwords" && styles.activeTab]}
          onPress={() => setActiveTab("passwords")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "passwords" && styles.activeTabText,
            ]}
          >
            Passwords
          </Text>
        </TouchableOpacity>
      </View>

      {displayData.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="delete-outline" size={60} color="#dadce0" />
          <Text style={styles.emptyStateText}>Trash is empty</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderTrashItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#202124" },
  emptyBtn: {
    backgroundColor: "#ffebe9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyText: { color: "#ff3b30", fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#f1f3f4",
    borderRadius: 8,
    padding: 4,
    marginBottom: 15,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  activeTab: {
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: { fontSize: 15, fontWeight: "bold", color: "#5f6368" },
  activeTabText: { color: "#1a73e8" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  trashCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: { flex: 1, marginRight: 10 },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#202124",
    marginBottom: 4,
  },
  subText: { fontSize: 14, color: "#5f6368" },

  // NEW: Styled deletion timestamp label
  deletedAtText: {
    fontSize: 12,
    color: "#5f6368",
    marginTop: 4,
    fontWeight: "600",
  },

  actionRow: { flexDirection: "row" },
  iconBtn: {
    padding: 8,
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: "#5f6368",
    fontWeight: "bold",
  },
});
