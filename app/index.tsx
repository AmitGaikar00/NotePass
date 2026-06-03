import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
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

const TEXT_COLORS = [
  "#202124",
  "#1a73e8",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#9aa0a6",
  "#673ab7",
];

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPinned, setIsPinned] = useState(false);

  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("list");

  // New states for V3 Expansion
  const [activeMenu, setActiveMenu] = useState("none"); // "none" | "bg" | "text"
  const [images, setImages] = useState([]);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklist, setChecklist] = useState([]);

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
    setImages([]);
    setChecklist([]);
    setSelectedColor(NOTE_COLORS[0]);
    setSelectedTextColor(TEXT_COLORS[0]);
    setIsChecklistMode(false);
    setEditingId(null);
    setIsPinned(false);
    setActiveMenu("none");
    setModalVisible(true);
  };

  const openEditNoteModal = (note) => {
    setTitle(note.title);
    setContent(note.content || "");
    setImages(note.images || []);
    setChecklist(note.checklist || []);
    setSelectedColor(note.color || NOTE_COLORS[0]);
    setSelectedTextColor(note.textColor || TEXT_COLORS[0]);
    setIsChecklistMode(note.isChecklistMode || false);
    setEditingId(note.id);
    setIsPinned(note.isPinned || false);
    setActiveMenu("none");
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!title && !content && checklist.length === 0 && images.length === 0)
      return;
    let updatedNotes = editingId
      ? notes.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title,
                content,
                color: selectedColor,
                textColor: selectedTextColor,
                images,
                checklist,
                isChecklistMode,
                isPinned,
              }
            : n,
        )
      : [
          {
            id: Date.now().toString(),
            title,
            content,
            color: selectedColor,
            textColor: selectedTextColor,
            images,
            checklist,
            isChecklistMode,
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

  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? "none" : menuName);
    Keyboard.dismiss();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const toggleChecklistMode = () => {
    if (!isChecklistMode) {
      const items = content
        .split("\n")
        .filter((t) => t.trim() !== "")
        .map((t, i) => ({
          id: Date.now().toString() + i,
          text: t,
          isChecked: false,
        }));
      setChecklist(
        items.length > 0
          ? items
          : [{ id: Date.now().toString(), text: "", isChecked: false }],
      );
    } else {
      const text = checklist.map((c) => c.text).join("\n");
      setContent(text);
    }
    setIsChecklistMode(!isChecklistMode);
  };

  const updateChecklistItem = (id, newProps) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, ...newProps } : item,
      ),
    );
  };

  const removeChecklistItem = (id) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const addChecklistItem = () => {
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: "", isChecked: false },
    ]);
  };

  let displayNotes = notes.filter((n) => !n.isTrashed);
  if (searchQuery)
    displayNotes = displayNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        onRequestClose={() => setModalVisible(false)}
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
                <MaterialIcons name="arrow-back" size={26} color="#202124" />
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

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onTouchStart={() => setActiveMenu("none")}
            >
              <TextInput
                style={[
                  styles.modalTitleInput,
                  { color: selectedTextColor, outlineStyle: "none" } as any,
                ]}
                placeholder="Title"
                placeholderTextColor="#9aa0a6"
                value={title}
                onChangeText={setTitle}
                onTouchStart={() => setActiveMenu("none")}
              />

              {images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.editorImage} />
                      <TouchableOpacity
                        style={styles.deleteImageBtn}
                        onPress={() => removeImage(index)}
                      >
                        <MaterialIcons name="close" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {isChecklistMode ? (
                <View
                  style={styles.checklistContainer}
                  onTouchStart={() => setActiveMenu("none")}
                >
                  {checklist.map((item) => (
                    <View key={item.id} style={styles.checklistItem}>
                      <TouchableOpacity
                        onPress={() =>
                          updateChecklistItem(item.id, {
                            isChecked: !item.isChecked,
                          })
                        }
                      >
                        <MaterialIcons
                          name={
                            item.isChecked
                              ? "check-box"
                              : "check-box-outline-blank"
                          }
                          size={26}
                          color={selectedTextColor}
                          style={item.isChecked && styles.checkedIcon}
                        />
                      </TouchableOpacity>
                      <TextInput
                        style={[
                          styles.checklistInput,
                          {
                            color: selectedTextColor,
                            outlineStyle: "none",
                          } as any,
                          item.isChecked && styles.checkedText,
                        ]}
                        value={item.text}
                        onChangeText={(txt) =>
                          updateChecklistItem(item.id, { text: txt })
                        }
                        placeholder="List item..."
                        placeholderTextColor="#9aa0a6"
                        onTouchStart={() => setActiveMenu("none")}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={() => removeChecklistItem(item.id)}
                        style={styles.removeChecklistBtn}
                      >
                        <MaterialIcons
                          name="close"
                          size={24}
                          color={selectedTextColor + "80"}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addChecklistBtn}
                    onPress={addChecklistItem}
                  >
                    <MaterialIcons
                      name="add"
                      size={24}
                      color={selectedTextColor}
                    />
                    <Text
                      style={[
                        styles.addChecklistText,
                        { color: selectedTextColor },
                      ]}
                    >
                      List item
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.modalContentInput,
                    { color: selectedTextColor, outlineStyle: "none" } as any,
                  ]}
                  placeholder="Note details..."
                  placeholderTextColor="#9aa0a6"
                  value={content}
                  onChangeText={setContent}
                  onTouchStart={() => setActiveMenu("none")}
                  multiline
                />
              )}
            </ScrollView>

            <View style={styles.editorToolbarWrapper}>
              {activeMenu === "bg" && (
                <View style={styles.secondaryMenu}>
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
              )}

              {activeMenu === "text" && (
                <View style={styles.secondaryMenu}>
                  {TEXT_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        selectedTextColor === color && styles.selectedSwatch,
                      ]}
                      onPress={() => setSelectedTextColor(color)}
                    />
                  ))}
                </View>
              )}

              <View style={styles.primaryToolbar}>
                <TouchableOpacity
                  style={styles.toolbarIcon}
                  onPress={pickImage}
                >
                  <MaterialIcons
                    name="add-photo-alternate"
                    size={26}
                    color="#5f6368"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toolbarIcon,
                    activeMenu === "bg" && styles.toolbarIconActive,
                  ]}
                  onPress={() => toggleMenu("bg")}
                >
                  <MaterialIcons
                    name="format-color-fill"
                    size={26}
                    color={activeMenu === "bg" ? "#1a73e8" : "#5f6368"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toolbarIcon,
                    activeMenu === "text" && styles.toolbarIconActive,
                  ]}
                  onPress={() => toggleMenu("text")}
                >
                  <MaterialIcons
                    name="border-color"
                    size={24}
                    color={activeMenu === "text" ? "#1a73e8" : "#5f6368"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toolbarIcon,
                    isChecklistMode && styles.toolbarIconActive,
                  ]}
                  onPress={toggleChecklistMode}
                >
                  <MaterialIcons
                    name="check-box"
                    size={26}
                    color={isChecklistMode ? "#1a73e8" : "#5f6368"}
                  />
                </TouchableOpacity>
              </View>
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
  fab: {
    position: "absolute",
    bottom: 60,
    right: 30,
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
    marginBottom: 15,
    paddingVertical: 5,
  },
  modalContentInput: {
    fontSize: 18,
    minHeight: 300,
    textAlignVertical: "top",
    paddingVertical: 5,
    fontWeight: "500",
  },

  // Image Preview Inline Styles
  imageScroll: { paddingHorizontal: 5, marginBottom: 15 },
  imageWrapper: { position: "relative", marginRight: 15 },
  editorImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    resizeMode: "cover",
  },
  deleteImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },

  // Perfectly Aligned Checklist Layout Styles
  checklistContainer: { paddingBottom: 20 },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checklistInput: { flex: 1, fontSize: 18, marginLeft: 10, paddingVertical: 0 },
  checkedText: { textDecorationLine: "line-through", opacity: 0.5 },
  checkedIcon: { opacity: 0.5 },
  removeChecklistBtn: { padding: 4, marginLeft: 5 },
  addChecklistBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  addChecklistText: { fontSize: 16, fontWeight: "bold", marginLeft: 10 },

  // Palette Toolbar Layout Styles
  editorToolbarWrapper: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    marginHorizontal: -20,
    marginBottom: -20,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
  },
  secondaryMenu: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f3f4",
    backgroundColor: "#fafafa",
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
  },
  selectedSwatch: { borderWidth: 3, borderColor: "#1a73e8" },
  primaryToolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
  },
  toolbarIcon: { padding: 10, borderRadius: 12 },
  toolbarIconActive: { backgroundColor: "#e8f0fe" },
});
