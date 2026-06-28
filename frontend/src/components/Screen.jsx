import { SafeAreaView } from "react-native-safe-area-context";

const Screen = ({ children, style, edges = ["top"] }) => {
	return (
		<SafeAreaView
			style={[{ flex: 1, backgroundColor: "#fff" }, style]}
			edges={edges}
		>
			{children}
		</SafeAreaView>
	);
};

export default Screen;
