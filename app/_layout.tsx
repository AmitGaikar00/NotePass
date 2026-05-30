import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Alert, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { documentDirectory } from "expo-file-system";
import {
  documentDirectory as legacyDocumentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";

import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

function CustomDrawerContent(props) {
  const handleExport = async () => {
    try {
      const notes = await AsyncStorage.getItem("@my_notes");
      const passwords = await SecureStore.getItemAsync("my_passwords");

      const backupData = {
        notes: notes ? JSON.parse(notes) : [],
        passwords: passwords ? JSON.parse(passwords) : [],
      };

      // FIX: Securely get the directory and ensure it has a trailing slash
      const dir = documentDirectory || legacyDocumentDirectory;
      if (!dir) {
        Alert.alert("Error", "Could not locate the system storage directory.");
        return;
      }

      const safeDir = dir.endsWith("/") ? dir : dir + "/";
      const fileUri = safeDir + "NotePass_Backup.json";

      await writeAsStringAsync(fileUri, JSON.stringify(backupData));

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Export NotePass Backup",
      });
    } catch (error) {
      Alert.alert(
        "Export Failed",
        "An error occurred while preparing your backup.",
      );
      console.error(error);
    }
  };

  // V3: Upgraded to a Smart Merge Import
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/json",
          "text/plain",
          "application/octet-stream",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await readAsStringAsync(fileUri);

      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (e) {
        Alert.alert(
          "Invalid File",
          "This file is corrupted or not a valid NotePass backup.",
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

      // Helper function to merge arrays and remove duplicates based on the 'id'
      const mergeAndDeduplicate = (existingArray, incomingArray) => {
        const map = new Map();
        // 1. Add existing items first
        existingArray.forEach((item) => map.set(item.id, item));
        // 2. Add incoming items ONLY if the ID doesn't already exist locally
        incomingArray.forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        // 3. Convert back to array and sort newest to oldest
        return Array.from(map.values()).sort((a, b) => b.id - a.id);
      };

      Alert.alert(
        "Merge Backup?",
        "This will add missing notes and passwords from the backup file to your device. Your existing data will not be overwritten or duplicated.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Merge Data",
            style: "default",
            onPress: async () => {
              // Process Notes Merge
              if (backupData.notes && backupData.notes.length > 0) {
                const existingNotesStr =
                  await AsyncStorage.getItem("@my_notes");
                const existingNotes = existingNotesStr
                  ? JSON.parse(existingNotesStr)
                  : [];
                const mergedNotes = mergeAndDeduplicate(
                  existingNotes,
                  backupData.notes,
                );
                await AsyncStorage.setItem(
                  "@my_notes",
                  JSON.stringify(mergedNotes),
                );
              }

              // Process Passwords Merge
              if (backupData.passwords && backupData.passwords.length > 0) {
                const existingPassStr =
                  await SecureStore.getItemAsync("my_passwords");
                const existingPass = existingPassStr
                  ? JSON.parse(existingPassStr)
                  : [];
                const mergedPass = mergeAndDeduplicate(
                  existingPass,
                  backupData.passwords,
                );
                await SecureStore.setItemAsync(
                  "my_passwords",
                  JSON.stringify(mergedPass),
                );
              }

              Alert.alert(
                "Success!",
                "Data merged successfully! Please tap around the app to refresh your screens.",
              );
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Import Failed", "Could not read the backup file.");
      console.error(error);
    }
  };

  return (
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
        label="Export Backup"
        icon={({ color, size }) => (
          <MaterialIcons name="file-upload" size={24} color={color} />
        )}
        onPress={handleExport}
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

      <DrawerItem
        label="Import Backup"
        icon={({ color, size }) => (
          <MaterialIcons name="file-download" size={24} color={color} />
        )}
        onPress={handleImport}
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
          drawerStyle: { width: "70%", backgroundColor: "#ffffff" },
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
