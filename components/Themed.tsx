import { Text as DefaultText, View as DefaultView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export function Text(props: DefaultText['props']) {
  const { style, ...otherProps } = props;
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? 'light'].text;

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: DefaultView['props']) {
  const { style, ...otherProps } = props;
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
} 