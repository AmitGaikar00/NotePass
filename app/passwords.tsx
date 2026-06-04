import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  Alert,
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
import PasswordCard from "../components/PasswordCard";

export default function PasswordsScreen() {
  const [passwords, setPasswords] = useState([]);
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalVisible, setModalVisible] = useState(false);
  const [isFormPasswordVisible, setIsFormPasswordVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortBy, setSortBy] = useState("date");

  useFocusEffect(
    useCallback(() => {
      loadPasswords();
    }, []),
  );

  const loadPasswords = async () => {
    try {
      const storedData = await SecureStore.getItemAsync("my_passwords");
      if (storedData) setPasswords(JSON.parse(storedData));
    } catch (e) {
      console.log("Error", e);
    }
  };

  const openNewPasswordModal = () => {
    setSite("");
    setUsername("");
    setPassword("");
    setEditingId(null);
    setIsFormPasswordVisible(false);
    setModalVisible(true);
  };

  const openEditPasswordModal = (item) => {
    setSite(item.site);
    setUsername(item.username);
    setPassword(item.password);
    setEditingId(item.id);
    setIsFormPasswordVisible(false);
    setModalVisible(true);
  };

  const savePassword = async () => {
    if (!site || !username || !password) return;

    const nowTimestamp = Date.now().toString();

    let updatedPasswords = editingId
      ? passwords.map((p) =>
          p.id === editingId
            ? { ...p, site, username, password, updatedAt: nowTimestamp }
            : p,
        )
      : [
          {
            id: nowTimestamp,
            site,
            username,
            password,
            isTrashed: false,
            updatedAt: nowTimestamp,
          },
          ...passwords,
        ];

    setPasswords(updatedPasswords);
    setModalVisible(false);
    await SecureStore.setItemAsync(
      "my_passwords",
      JSON.stringify(updatedPasswords),
    );
  };

  const moveToTrash = async (id) => {
    const nowTimestamp = Date.now().toString();

    const updated = passwords.map((p) =>
      p.id === id
        ? {
            ...p,
            isTrashed: true,
            deletedAt: Date.now().toString(),
            updatedAt: nowTimestamp,
          }
        : p,
    );
    setPasswords(updated);
    await SecureStore.setItemAsync("my_passwords", JSON.stringify(updated));
    setModalVisible(false);
  };

  const copyToClipboard = async (text, fieldName) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${fieldName} copied to clipboard.`);
  };

  let displayPasswords = passwords.filter(
    (p) =>
      !p.isTrashed && p.site.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  displayPasswords.sort((a, b) => {
    if (sortBy === "site") return a.site.localeCompare(b.site);

    const dateA = a.updatedAt || a.id;
    const dateB = b.updatedAt || b.id;
    return dateB - dateA;
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
            onPress={() => setSortBy("site")}
            style={[styles.sortBtn, sortBy === "site" && styles.sortBtnActive]}
          >
            <Text
              style={[
                styles.sortText,
                sortBy === "site" && styles.sortTextActive,
              ]}
            >
              Site
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { outlineStyle: "none" } as any]}
          placeholder="Search sites..."
          value={searchQuery}
          onChangeText={setSearchQuery}
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

      <FlatList
        data={displayPasswords}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PasswordCard
            item={item}
            onEdit={openEditPasswordModal}
            onDelete={moveToTrash}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openNewPasswordModal}>
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#e8f0fe" }}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                {/* <Text style={styles.cancelText}>Cancel</Text> */}
                <MaterialIcons name="arrow-back" size={26} color="#202124" />
              </TouchableOpacity>
              <View style={styles.headerRightControls}>
                {editingId && (
                  <TouchableOpacity
                    onPress={() => moveToTrash(editingId)}
                    style={styles.modalDeleteBtn}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={26}
                      color="#ff3b30"
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={savePassword}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.modalHeaderTitle}>
              {editingId ? "Edit Password" : "New Password"}
            </Text>

            {/* V3: Wrapped inputs in ScrollView */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.modalInput, { outlineStyle: "none" } as any]}
                  placeholder="Site / App Name"
                  value={site}
                  onChangeText={setSite}
                  autoFocus={true}
                />
              </View>

              <View style={styles.passwordFormRow}>
                <TextInput
                  style={[
                    styles.modalInput,
                    { flex: 1, outlineStyle: "none" } as any,
                  ]}
                  placeholder="Username / Email"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                {username.length > 0 && (
                  <TouchableOpacity
                    onPress={() => copyToClipboard(username, "Username")}
                    style={styles.iconBtn}
                  >
                    <MaterialIcons
                      name="content-copy"
                      size={22}
                      color="#5f6368"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.passwordFormRow}>
                <TextInput
                  style={[
                    styles.modalInput,
                    { flex: 1, outlineStyle: "none" } as any,
                  ]}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isFormPasswordVisible}
                />

                {password.length > 0 && (
                  <TouchableOpacity
                    onPress={() => copyToClipboard(password, "Password")}
                    style={styles.iconBtn}
                  >
                    <MaterialIcons
                      name="content-copy"
                      size={22}
                      color="#5f6368"
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() =>
                    setIsFormPasswordVisible(!isFormPasswordVisible)
                  }
                  style={styles.formToggleBtn}
                >
                  <Text style={styles.formToggleText}>
                    {isFormPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 15,
    marginHorizontal: 20,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#202124", height: "100%" },
  clearBtn: { padding: 5 },
  listContainer: { paddingBottom: 80, paddingHorizontal: 16 },

  // V3: FAB moved upwards
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
  cancelText: {
    fontSize: 16,
    color: "#202124",
    paddingVertical: 10,
    fontWeight: "bold",
  },
  headerRightControls: { flexDirection: "row", alignItems: "center" },
  modalDeleteBtn: {
    padding: 8,
    marginRight: 15,
    backgroundColor: "rgba(217, 48, 37, 0.1)",
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: { fontSize: 16, color: "#ffffff", fontWeight: "bold" },
  modalHeaderTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#202124",
    marginBottom: 30,
  },
  inputWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  modalInput: {
    fontSize: 18,
    paddingVertical: 15,
    color: "#202124",
    fontWeight: "500",
  },
  passwordFormRow: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 20,
    paddingLeft: 15,
    paddingRight: 5,
  },
  iconBtn: { paddingHorizontal: 10 },
  formToggleBtn: {
    backgroundColor: "#f1f3f4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  formToggleText: { color: "#1a73e8", fontWeight: "bold", fontSize: 14 },
});
