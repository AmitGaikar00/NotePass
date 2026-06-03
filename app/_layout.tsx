// V3 SECURITY: This MUST be the very first line in the file!
import "react-native-get-random-values";

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import CryptoJS from "crypto-js";
import * as DocumentPicker from "expo-document-picker";
import { documentDirectory } from "expo-file-system";
import {
  documentDirectory as legacyDocumentDirectory,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { Drawer } from "expo-router/drawer";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function CustomDrawerContent(props) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [actionType, setActionType] = useState("");
  const [importUri, setImportUri] = useState(null);

  const initiateExport = () => {
    setPassword("");
    setActionType("export");
    setModalVisible(true);
  };

  const initiateImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setImportUri(result.assets[0].uri);
      setPassword("");
      setActionType("import");
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Could not open the file picker.");
    }
  };

  // V3 UX FIX: Extracted the Local Save logic
  const saveLocally = async (encryptedData) => {
    try {
      const permissions =
        await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          "My_Vault.notepass",
          "application/octet-stream",
        );
        await writeAsStringAsync(uri, encryptedData);
        Alert.alert("Success!", "Secure NotePass vault saved to your device.");
      }
    } catch (e) {
      Alert.alert("Save Failed", String(e));
    }
  };

  // V3 UX FIX: Extracted the Share Sheet logic
  const shareVault = async (encryptedData) => {
    try {
      const dir = documentDirectory || legacyDocumentDirectory;
      const safeDir = dir.endsWith("/") ? dir : dir + "/";
      const fileUri = safeDir + "My_Vault.notepass";

      await writeAsStringAsync(fileUri, encryptedData);

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/octet-stream",
        dialogTitle: "Export Secure Vault",
      });
    } catch (e) {
      Alert.alert("Share Failed", String(e));
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      Alert.alert("Required", "Please enter a password.");
      return;
    }

    setModalVisible(false);

    if (actionType === "export") {
      try {
        const notes = await AsyncStorage.getItem("@my_notes");
        const passwords = await SecureStore.getItemAsync("my_passwords");

        const backupData = {
          notes: notes ? JSON.parse(notes) : [],
          passwords: passwords ? JSON.parse(passwords) : [],
        };

        const rawJson = JSON.stringify(backupData);
        const encryptedData = CryptoJS.AES.encrypt(
          rawJson,
          password,
        ).toString();

        // V3 UX FIX: Ask the user where they want it to go!
        if (Platform.OS === "android") {
          Alert.alert(
            "Export Destination",
            "Where would you like to send your secure vault?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Share (Email, WhatsApp, etc.)",
                onPress: () => shareVault(encryptedData),
              },
              {
                text: "Save to Device Folder",
                onPress: () => saveLocally(encryptedData),
              },
            ],
          );
        } else {
          // iOS automatically handles "Save to Files" inside the Share Sheet natively
          await shareVault(encryptedData);
        }
      } catch (error) {
        Alert.alert("Export Failed", String(error));
        console.error(error);
      }
    } else if (actionType === "import") {
      try {
        const fileContent = await readAsStringAsync(importUri);

        let backupData;
        try {
          const bytes = CryptoJS.AES.decrypt(fileContent, password);
          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

          if (!decryptedText) throw new Error("Wrong Password");

          backupData = JSON.parse(decryptedText);
        } catch (e) {
          Alert.alert(
            "Decryption Failed",
            "Incorrect password or corrupted backup file.",
          );
          return;
        }

        if (!backupData.notes && !backupData.passwords) {
          Alert.alert(
            "Invalid File",
            "This file does not contain NotePass data.",
          );
          return;
        }

        const mergeAndDeduplicate = (existingArray, incomingArray) => {
          const map = new Map();
          existingArray.forEach((item) => map.set(item.id, item));
          incomingArray.forEach((item) => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          return Array.from(map.values()).sort((a, b) => b.id - a.id);
        };

        if (backupData.notes) {
          const existingNotesStr = await AsyncStorage.getItem("@my_notes");
          const existingNotes = existingNotesStr
            ? JSON.parse(existingNotesStr)
            : [];
          await AsyncStorage.setItem(
            "@my_notes",
            JSON.stringify(
              mergeAndDeduplicate(existingNotes, backupData.notes),
            ),
          );
        }

        if (backupData.passwords) {
          const existingPassStr =
            await SecureStore.getItemAsync("my_passwords");
          const existingPass = existingPassStr
            ? JSON.parse(existingPassStr)
            : [];
          await SecureStore.setItemAsync(
            "my_passwords",
            JSON.stringify(
              mergeAndDeduplicate(existingPass, backupData.passwords),
            ),
          );
        }

        Alert.alert("Success!", "Secure vault merged successfully!");
      } catch (error) {
        Alert.alert("Import Failed", String(error));
        console.error(error);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />

        <View
          style={{
            height: 1,
            backgroundColor: "#e0e0e0",
            marginVertical: 15,
            marginHorizontal: 20,
          }}
        />

        <DrawerItem
          label="Export Vault (.notepass)"
          icon={({ color }) => (
            <MaterialIcons name="security" size={24} color={color} />
          )}
          onPress={initiateExport}
          labelStyle={{
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: -5,
            paddingVertical: 5,
          }}
          style={{
            borderRadius: 0,
            marginHorizontal: 0,
            marginVertical: 0,
            paddingLeft: 10,
          }}
          inactiveTintColor="#1a73e8"
        />

        <DrawerItem
          label="Import Vault (.notepass)"
          icon={({ color }) => (
            <MaterialIcons name="lock-open" size={24} color={color} />
          )}
          onPress={initiateImport}
          labelStyle={{
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: -5,
            paddingVertical: 5,
          }}
          style={{
            borderRadius: 0,
            marginHorizontal: 0,
            marginVertical: 0,
            paddingLeft: 10,
          }}
          inactiveTintColor="#5f6368"
        />
      </DrawerContentScrollView>

      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === "export" ? "Secure Your Vault" : "Unlock Vault"}
            </Text>
            <Text style={styles.modalSub}>
              {actionType === "export"
                ? "Create a password to encrypt this vault. You will need it to restore your data."
                : "Enter the password you used to encrypt this vault file."}
            </Text>

            <TextInput
              style={[styles.passwordInput, { outlineStyle: "none" } as any]}
              placeholder="Enter Master Password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePasswordSubmit}
                style={styles.submitBtn}
              >
                <Text style={styles.submitText}>
                  {actionType === "export" ? "Encrypt Vault" : "Decrypt Vault"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerTitleAlign: "left",
          headerTintColor: "#000000",
          headerStyle: { backgroundColor: "#ffffff" },
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 22,
            color: "#000000",
            marginLeft: -5,
          },
          drawerActiveTintColor: "#1a73e8",
          drawerActiveBackgroundColor: "#e8f0fe",
          drawerInactiveTintColor: "#5f6368",
          drawerStyle: { width: "80%", backgroundColor: "#ffffff" },
          drawerLabelStyle: {
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: -5,
            paddingVertical: 5,
          },
          drawerItemStyle: {
            borderRadius: 0,
            marginHorizontal: 0,
            marginVertical: 0,
            paddingLeft: 10,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "Notes",
            drawerLabel: "Notes",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="notes" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="passwords"
          options={{
            title: "Passwords",
            drawerLabel: "Passwords",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="lock" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="trash"
          options={{
            title: "Trash",
            drawerLabel: "Trash",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="delete" size={24} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#202124",
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 14,
    color: "#5f6368",
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInput: {
    backgroundColor: "#f1f3f4",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 25,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 15, marginRight: 10 },
  cancelText: { fontSize: 16, color: "#5f6368", fontWeight: "bold" },
  submitBtn: {
    backgroundColor: "#1a73e8",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  submitText: { fontSize: 16, color: "#ffffff", fontWeight: "bold" },
});
