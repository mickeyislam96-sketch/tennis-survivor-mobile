import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { avatarColour, initials, getPlayerImageUrl } from '../utils/playerImage';
import { fonts } from '../theme';

interface PlayerAvatarProps {
  playerId?: string;
  playerName: string;
  size?: number;
}

/**
 * Circular player avatar with headshot fallback chain:
 * 1. Try headshot from finalserveivor.com/headshots/
 * 2. Fall back to coloured initials circle
 */
const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerId,
  playerName,
  size = 32,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getPlayerImageUrl(playerId || '', playerName);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Show image if URL exists and hasn't failed
  if (imageUrl && !imgFailed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, containerStyle]}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Initials fallback
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
