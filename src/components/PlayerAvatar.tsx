import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { avatarColour, initials, getPlayerImageUrls } from '../utils/playerImage';
import { fonts } from '../theme';

interface PlayerAvatarProps {
  playerId?: string;
  playerName: string;
  size?: number;
}

/**
 * Circular player avatar with headshot fallback chain:
 * 1. Try each candidate URL in order (real ID → name slug)
 * 2. Fall back to coloured initials circle
 */
const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerId,
  playerName,
  size = 32,
}) => {
  const urls = getPlayerImageUrls(playerId || '', playerName);
  const [urlIndex, setUrlIndex] = useState(0);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const currentUrl = urls[urlIndex];

  // Show image if we still have URLs to try
  if (currentUrl) {
    return (
      <Image
        source={{ uri: currentUrl }}
        style={[styles.image, containerStyle]}
        onError={() => setUrlIndex((i) => i + 1)}
      />
    );
  }

  // Initials fallback (all URLs exhausted)
  const bg = avatarColour(playerName);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.initialsContainer, containerStyle, { backgroundColor: bg }]}>
      <Text style={[styles.initialsText, { fontSize }]}>
        {initials(playerName)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E3E0D7',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansSemiBold,
    textAlign: 'center',
  },
});

export default PlayerAvatar;
