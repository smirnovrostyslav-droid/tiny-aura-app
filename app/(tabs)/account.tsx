import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

const MENU_ITEMS = [
  { icon: '👤', title: 'My Profile', subtitle: 'Manage your personal information' },
  { icon: '📦', title: 'My Orders', subtitle: 'Track your orders and history' },
  { icon: '📍', title: 'Addresses', subtitle: 'Manage shipping addresses' },
  { icon: '💳', title: 'Payment Methods', subtitle: 'Manage payment options' },
  { icon: '🔔', title: 'Notifications', subtitle: 'Manage your preferences' },
  { icon: '❓', title: 'Help & Support', subtitle: 'FAQs and contact us' },
];

export default function AccountScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome to Tiny Aura</Text>
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInButtonText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2025 Tiny Aura</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.lightGray,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarIcon: {
    fontSize: 48,
  },
  welcomeText: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  signInButton: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  menuSection: {
    padding: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.xs,
  },
  menuSubtitle: {
    ...Typography.caption,
  },
  menuArrow: {
    fontSize: 18,
    color: Colors.mediumGray,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
});
