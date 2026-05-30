import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
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
import { SafeAreaView } from "react-native-safe-area-context"; // Updated Import

const PasswordCard = ({ item, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(parseInt(timestamp));
    return d.toLocaleDateString("en-US", {
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
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.site}
        </Text>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.dateText}>{formatDate(item.id)}</Text>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={styles.iconButton}
          >
            <MaterialIcons name="delete-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.cardBody}>User: {item.username}</Text>

      <View style={styles.passwordRow}>
        <Text style={styles.cardBody}>
          Pass: {isVisible ? item.password : "••••••••••••"}
        </Text>
        <TouchableOpacity
          onPress={() => setIsVisible(!isVisible)}
          style={styles.toggleBtn}
        >
          <Text style={styles.toggleText}>{isVisible ? "Hide" : "View"}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function PasswordsScreen() {
  const [passwords, setPasswords] = useState([]);
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalVisible, setModalVisible] = useState(false);
  const [isFormPasswordVisible, setIsFormPasswordVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = async () => {
    try {
      const storedData = await SecureStore.getItemAsync("my_passwords");
      if (storedData) setPasswords(JSON.parse(storedData));
    } catch (e) {
      console.log("Error loading passwords", e);
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
    if (!site || !username || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    let updatedPasswords = editingId
      ? passwords.map((p) =>
          p.id === editingId ? { ...p, site, username, password } : p,
        )
      : [{ id: Date.now().toString(), site, username, password }, ...passwords];

    setPasswords(updatedPasswords);
    setSite("");
    setUsername("");
    setPassword("");
    setEditingId(null);
    setIsFormPasswordVisible(false);
    setModalVisible(false);

    await SecureStore.setItemAsync(
      "my_passwords",
      JSON.stringify(updatedPasswords),
    );
  };

  const deletePassword = async (id) => {
    const filtered = passwords.filter((item) => item.id !== id);
    setPasswords(filtered);
    await SecureStore.setItemAsync("my_passwords", JSON.stringify(filtered));
  };

  const filteredPasswords = passwords.filter((item) =>
    item.site.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { outlineStyle: "none" } as any]}
          placeholder="Search sites..."
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

      <FlatList
        data={filteredPasswords}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PasswordCard
            item={item}
            onEdit={openEditPasswordModal}
            onDelete={deletePassword}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openNewPasswordModal}>
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#e8f0fe" }}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.headerRightControls}>
                {editingId && (
                  <TouchableOpacity
                    onPress={() => {
                      deletePassword(editingId);
                      setModalVisible(false);
                    }}
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

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.modalInput, { outlineStyle: "none" } as any]}
                placeholder="Site / App Name"
                placeholderTextColor="#5f6368"
                value={site}
                onChangeText={setSite}
                autoFocus={true}
                underlineColorAndroid="transparent"
                selectionColor="#1a73e8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.modalInput, { outlineStyle: "none" } as any]}
                placeholder="Username / Email"
                placeholderTextColor="#5f6368"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                selectionColor="#1a73e8"
              />
            </View>

            <View style={styles.passwordFormRow}>
              <TextInput
                style={[
                  styles.modalInput,
                  { flex: 1, outlineStyle: "none" } as any,
                ]}
                placeholder="Password"
                placeholderTextColor="#5f6368"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isFormPasswordVisible}
                underlineColorAndroid="transparent"
                selectionColor="#1a73e8"
              />
              <TouchableOpacity
                onPress={() => setIsFormPasswordVisible(!isFormPasswordVisible)}
                style={styles.formToggleBtn}
              >
                <Text style={styles.formToggleText}>
                  {isFormPasswordVisible ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f3f4', 
    borderRadius: 24, 
    paddingLeft: 20, 
    paddingRight: 10, 
    marginBottom: 15, 
    marginHorizontal: 20, 
    height: 48, 
    marginTop: 10 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#202124',
    height: '100%' 
  },
  clearBtn: {
    padding: 5,
  },
  
  listContainer: { paddingBottom: 80, paddingHorizontal: 16 },

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
    fontSize: 15,
    color: "#3c4043",
    marginBottom: 6,
    fontWeight: "500",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 5,
  },
  toggleBtn: {
    marginLeft: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleText: { fontSize: 12, color: "#1a73e8", fontWeight: "bold" },

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
  formToggleBtn: {
    backgroundColor: "#f1f3f4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formToggleText: { color: "#1a73e8", fontWeight: "bold", fontSize: 14 },
});
