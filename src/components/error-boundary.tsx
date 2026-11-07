import React, { type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './ui/button';

export class ErrorBoundary extends React.Component<{ children: ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-bg px-6">
          <Text className="text-lg font-semibold text-text">Something went wrong</Text>
          <Text className="mt-2 text-center text-sm text-text-muted">{this.state.error.message}</Text>
          <Button label="Try again" style={{ marginTop: 24 }} onPress={() => this.setState({ error: undefined })} />
        </View>
      );
    }
    return this.props.children;
  }
}
