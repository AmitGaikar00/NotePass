import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// NEW: Import the specific legacy methods to clear the warnings and prevent crashes
import { readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

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

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("@my_notes");
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch (e) {
      console.log("Error loading notes", e);
    }
  };

  const openNewNoteModal = () => {
    setTitle("");
    setContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEditNoteModal = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color || NOTE_COLORS[0]);
    setEditingId(note.id);
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!title && !content) {
      Alert.alert("Error", "Please enter a note.");
      return;
    }

    let updatedNotes = editingId
      ? notes.map((n) =>
          n.id === editingId
            ? { ...n, title, content, color: selectedColor }
            : n,
        )
      : [
          { id: Date.now().toString(), title, content, color: selectedColor },
          ...notes,
        ];

    setNotes(updatedNotes);
    setTitle("");
    setContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setEditingId(null);
    setModalVisible(false);

    await AsyncStorage.setItem("@my_notes", JSON.stringify(updatedNotes));
  };

  const deleteNote = async (id) => {
    const filteredNotes = notes.filter((note) => note.id !== id);
    setNotes(filteredNotes);
    await AsyncStorage.setItem("@my_notes", JSON.stringify(filteredNotes));
  };

  const importNoteFromTxt = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (!file.name.toLowerCase().endsWith(".txt")) {
          Alert.alert("Invalid File", "Please select a .txt file.");
          return;
        }

        // UPDATED: Using the legacy read function
        const fileContent = await readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const fileTitle = file.name.replace(".txt", "");

        const newNote = {
          id: Date.now().toString(),
          title: fileTitle,
          content: fileContent,
          color: NOTE_COLORS[0],
        };

        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        await AsyncStorage.setItem("@my_notes", JSON.stringify(updatedNotes));

        Alert.alert("Success", "Note imported successfully!");
      }
    } catch (error) {
      console.log("Import Error:", error);
      Alert.alert("Error", "Failed to import the text file.");
    }
  };

  const exportNoteToTxt = async () => {
    if (!title && !content) {
      Alert.alert("Empty Note", "There is nothing to export yet.");
      return;
    }

    try {
      const fileName = title
        ? `${title.replace(/[^a-z0-9]/gi, "_")}.txt`
        : `Note_${Date.now()}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const fileText = `Title: ${title}\n\n${content}`;

      // UPDATED: Using the legacy write function
      await writeAsStringAsync(fileUri, fileText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Export Note",
        });
      } else {
        Alert.alert("Error", "Sharing is not supported on this device.");
      }
    } catch (error) {
      console.log("Export Error:", error);
      Alert.alert("Error", "Failed to export the note.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(parseInt(timestamp));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { outlineStyle: "none" } as any]}
            placeholder="Search your notes"
            placeholderTextColor="#5f6368"
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
            selectionColor="#1a73e8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="cancel" size={22} color="#5f6368" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={importNoteFromTxt}
          activeOpacity={0.7}
        >
          <MaterialIcons name="file-download" size={24} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: item.color || NOTE_COLORS[0] },
            ]}
            onPress={() => openEditNoteModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.cardHeaderRight}>
                <Text style={styles.dateText}>{formatDate(item.id)}</Text>
                <TouchableOpacity
                  onPress={() => deleteNote(item.id)}
                  style={styles.iconButton}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={22}
                    color="#ff3b30"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardBody} numberOfLines={5}>
              {item.content}
            </Text>
          </TouchableOpacity>
        )}
      />

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
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.headerRightControls}>
                <TouchableOpacity
                  onPress={exportNoteToTxt}
                  style={styles.modalActionBtn}
                >
                  <MaterialIcons name="ios-share" size={24} color="#1a73e8" />
                </TouchableOpacity>

                {editingId && (
                  <TouchableOpacity
                    onPress={() => {
                      deleteNote(editingId);
                      setModalVisible(false);
                    }}
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

            <TextInput
              style={[styles.modalTitleInput, { outlineStyle: "none" } as any]}
              placeholder="Title"
              placeholderTextColor="#5f6368"
              value={title}
              onChangeText={setTitle}
              autoFocus={true}
              underlineColorAndroid="transparent"
              selectionColor="#1a73e8"
            />
            <TextInput
              style={[
                styles.modalContentInput,
                { outlineStyle: "none" } as any,
              ]}
              placeholder="Note details..."
              placeholderTextColor="#5f6368"
              value={content}
              onChangeText={setContent}
              multiline
              underlineColorAndroid="transparent"
              selectionColor="#1a73e8"
            />

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

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 0,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 10,
    marginRight: 10,
    height: 48,
  },
  searchInput: {
    flex: 1, // CRITICAL: This pushes the X button completely to the right
    fontSize: 16,
    color: "#202124",
    height: "100%",
  },
  clearBtn: {
    padding: 5,
  },

  importBtn: {
    backgroundColor: "#e8f0fe",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  listContainer: { paddingBottom: 80, paddingHorizontal: 16 },

  card: {
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
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#202124",
    flex: 1,
    marginRight: 10,
  },
  cardHeaderRight: { flexDirection: "row", alignItems: "center" },
  dateText: {
    fontSize: 12,
    color: "#5f6368",
    marginRight: 10,
    fontWeight: "600",
  },
  iconButton: { padding: 4 },
  cardBody: {
    fontSize: 16,
    color: "#3c4043",
    lineHeight: 22,
    fontWeight: "500",
  },

  fab: {
    position: "absolute",
    bottom: 20,
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
    marginRight: 10,
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
  modalContentInput: {
    fontSize: 18,
    color: "#202124",
    flex: 1,
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
