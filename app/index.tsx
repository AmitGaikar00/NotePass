import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NoteCard from "../components/NoteCard";

const NOTE_COLORS = [
  "#e8f0fe",
  "#ffffff",
  "#fce8e6",
  "#fef0db",
  "#fbf4a1",
  "#e6f4ea",
  "#f3e8fd",
];

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPinned, setIsPinned] = useState(false);

  const [sortBy, setSortBy] = useState("title");
  const [viewMode, setViewMode] = useState("list");

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("@my_notes");
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch (e) {
      console.log("Error", e);
    }
  };

  const openNewNoteModal = () => {
    setTitle("");
    setContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setEditingId(null);
    setIsPinned(false);
    setModalVisible(true);
  };

  const openEditNoteModal = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color || NOTE_COLORS[0]);
    setEditingId(note.id);
    setIsPinned(note.isPinned || false);
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!title && !content) return;
    let updatedNotes = editingId
      ? notes.map((n) =>
          n.id === editingId
            ? { ...n, title, content, color: selectedColor, isPinned }
            : n,
        )
      : [
          {
            id: Date.now().toString(),
            title,
            content,
            color: selectedColor,
            isPinned,
            isTrashed: false,
          },
          ...notes,
        ];

    setNotes(updatedNotes);
    setModalVisible(false);
    await AsyncStorage.setItem("@my_notes", JSON.stringify(updatedNotes));
  };

  const moveToTrash = async (id) => {
    const updated = notes.map((n) =>
      n.id === id
        ? {
            ...n,
            isTrashed: true,
            isPinned: false,
            deletedAt: Date.now().toString(),
          }
        : n,
    );
    setNotes(updated);
    await AsyncStorage.setItem("@my_notes", JSON.stringify(updated));
    setModalVisible(false);
  };

  let displayNotes = notes.filter((n) => !n.isTrashed);
  if (searchQuery)
    displayNotes = displayNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  displayNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return b.id - a.id;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlsHeader}>
        <View style={styles.sortGroup}>
          <TouchableOpacity
            onPress={() => setSortBy("title")}
            style={[styles.sortBtn, sortBy === "title" && styles.sortBtnActive]}
          >
            <Text
              style={[
                styles.sortText,
                sortBy === "title" && styles.sortTextActive,
              ]}
            >
              Title
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("date")}
            style={[styles.sortBtn, sortBy === "date" && styles.sortBtnActive]}
          >
            <Text
              style={[
                styles.sortText,
                sortBy === "date" && styles.sortTextActive,
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          style={styles.viewToggleBtn}
        >
          <MaterialIcons
            name={viewMode === "list" ? "grid-view" : "view-agenda"}
            size={26}
            color="#5f6368"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { outlineStyle: "none" } as any]}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
            >
              <MaterialIcons name="cancel" size={22} color="#5f6368" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {viewMode === "list" ? (
        <FlatList
          key="L"
          data={displayNotes}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <NoteCard
              item={item}
              onEdit={openEditNoteModal}
              onDelete={moveToTrash}
              viewMode={viewMode}
            />
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          <View style={styles.masonryContainer}>
            <View style={styles.masonryColumn}>
              {displayNotes
                .filter((_, index) => index % 2 === 0)
                .map((item) => (
                  <NoteCard
                    key={item.id}
                    item={item}
                    onEdit={openEditNoteModal}
                    onDelete={moveToTrash}
                    viewMode={viewMode}
                  />
                ))}
            </View>
            <View style={styles.masonryColumn}>
              {displayNotes
                .filter((_, index) => index % 2 !== 0)
                .map((item) => (
                  <NoteCard
                    key={item.id}
                    item={item}
                    onEdit={openEditNoteModal}
                    onDelete={moveToTrash}
                    viewMode={viewMode}
                  />
                ))}
            </View>
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={openNewNoteModal}>
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: selectedColor }}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.headerRightControls}>
                <TouchableOpacity
                  onPress={() => setIsPinned(!isPinned)}
                  style={styles.modalActionBtn}
                >
                  <MaterialIcons
                    name="push-pin"
                    size={26}
                    color={isPinned ? "#1a73e8" : "#a0aab5"}
                  />
                </TouchableOpacity>
                {editingId && (
                  <TouchableOpacity
                    onPress={() => moveToTrash(editingId)}
                    style={styles.modalActionBtn}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={26}
                      color="#ff3b30"
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={saveNote} style={styles.saveButton}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* V3: Wrapped inputs in ScrollView to fix the static screen keyboard bug */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={[
                  styles.modalTitleInput,
                  { outlineStyle: "none" } as any,
                ]}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                autoFocus={true}
              />

              {/* V3: Content input now expands using minHeight instead of flex: 1 */}
              <TextInput
                style={[
                  styles.modalContentInput,
                  { outlineStyle: "none" } as any,
                ]}
                placeholder="Note details..."
                value={content}
                onChangeText={setContent}
                multiline
              />
            </ScrollView>

            <View style={styles.colorPickerContainer}>
              {NOTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedSwatch,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingTop: 10 },
  controlsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sortGroup: {
    flexDirection: "row",
    backgroundColor: "#f1f3f4",
    borderRadius: 20,
    padding: 3,
  },
  sortBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 18 },
  sortBtnActive: {
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  sortText: { fontSize: 14, color: "#5f6368", fontWeight: "bold" },
  sortTextActive: { color: "#1a73e8" },
  viewToggleBtn: { padding: 5 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 10,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#202124", height: "100%" },
  clearBtn: { padding: 5 },
  listContainer: { paddingBottom: 80, paddingHorizontal: 16 },
  masonryContainer: { flexDirection: "row", justifyContent: "space-between" },
  masonryColumn: { width: "48%" },

  // V3: FAB moved upwards
  fab: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#1a73e8",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalContainer: { flex: 1, padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  cancelText: {
    fontSize: 16,
    color: "#202124",
    paddingVertical: 10,
    fontWeight: "bold",
  },
  headerRightControls: { flexDirection: "row", alignItems: "center" },
  modalActionBtn: {
    padding: 8,
    marginRight: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 5,
  },
  saveText: { fontSize: 16, color: "#ffffff", fontWeight: "bold" },
  modalTitleInput: {
    fontSize: 22,
    fontWeight: "800",
    color: "#202124",
    marginBottom: 15,
    paddingVertical: 5,
  },

  // V3: Changed flex to minHeight so the ScrollView can measure and scroll it correctly
  modalContentInput: {
    fontSize: 18,
    color: "#202124",
    minHeight: 300,
    textAlignVertical: "top",
    paddingVertical: 5,
    fontWeight: "500",
  },

  colorPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  selectedSwatch: { borderWidth: 3, borderColor: "#1a73e8" },
});
