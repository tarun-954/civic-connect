# Fonts Setup Guide

## Available Fonts

This project includes the following font families:

### 1. Open Sans (Primary)
- **Regular**: `OpenSans-Regular`
- **Bold**: `OpenSans-Bold`
- **Best for**: Body text, general UI elements

### 2. Roboto (Secondary)
- **Regular**: `Roboto-Regular`
- **Bold**: `Roboto-Bold`
- **Best for**: Labels, secondary text

### 3. Poppins (Display)
- **Regular**: `Poppins-Regular`
- **Bold**: `Poppins-Bold`
- **Best for**: Headers, titles, display text

### 4. Montserrat (Accent)
- **Regular**: `Montserrat-Regular`
- **Bold**: `Montserrat-Bold`
- **Best for**: Special elements, accent text

## Setup Instructions

### Step 1: Download Font Files

You need to download the actual font files from Google Fonts:

1. **Open Sans**: https://fonts.google.com/specimen/Open+Sans
2. **Roboto**: https://fonts.google.com/specimen/Roboto
3. **Poppins**: https://fonts.google.com/specimen/Poppins
4. **Montserrat**: https://fonts.google.com/specimen/Montserrat

For each font:
- Click "Download family"
- Extract the ZIP file
- Copy the `.ttf` files to `apps/mobile/src/assets/fonts/`
- Replace the placeholder files

### Step 2: Install Fonts

Run the following command to install the fonts:

```bash
npx expo install expo-font
```

### Step 3: Use Fonts in Your Code

Import the font utilities:

```typescript
import { Fonts, TextStyles } from '../utils/fonts';
```

#### Method 1: Using Predefined Styles

```typescript
<Text style={TextStyles.h1}>Main Heading</Text>
<Text style={TextStyles.body}>Body text</Text>
<Text style={TextStyles.caption}>Caption text</Text>
```

#### Method 2: Using Font Families Directly

```typescript
const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
  },
  body: {
    fontFamily: Fonts.primary.regular,
    fontSize: 16,
  },
});
```

#### Method 3: Custom Font Combinations

```typescript
const styles = StyleSheet.create({
  customText: {
    fontFamily: Fonts.accent.regular,
    fontSize: 18,
    fontWeight: '500',
  },
});
```

## Font Usage Examples

### Headers
```typescript
// Main page title
<Text style={TextStyles.h1}>Welcome</Text>

// Section headers
<Text style={TextStyles.h2}>Analytics</Text>

// Subsection headers
<Text style={TextStyles.h3}>Report Status</Text>
```

### Body Text
```typescript
// Regular body text
<Text style={TextStyles.body}>This is regular body text</Text>

// Bold body text
<Text style={TextStyles.bodyBold}>This is bold body text</Text>
```

### Labels and Captions
```typescript
// Form labels
<Text style={TextStyles.label}>Email Address</Text>

// Captions
<Text style={TextStyles.caption}>Last updated 2 hours ago</Text>
```

### Buttons
```typescript
// Primary button
<Text style={TextStyles.button}>Submit Report</Text>

// Small button
<Text style={TextStyles.buttonSmall}>Cancel</Text>
```

## Font Sizes

Use the predefined font sizes:

```typescript
import { FontSizes } from '../utils/fonts';

const styles = StyleSheet.create({
  smallText: {
    fontSize: FontSizes.sm, // 14
  },
  largeText: {
    fontSize: FontSizes.xl, // 20
  },
});
```

## Troubleshooting

### Fonts Not Loading
1. Ensure font files are in the correct directory: `apps/mobile/src/assets/fonts/`
2. Check that font file names match exactly (case-sensitive)
3. Restart the development server after adding fonts
4. Clear cache: `npx expo start --clear`

### Font Names
- Font family names should match the font file names exactly
- Use the names defined in `Fonts` object
- Avoid spaces in font family names

### Performance
- Limit the number of font files to avoid app size bloat
- Use system fonts as fallbacks
- Consider font subsetting for production builds

## Best Practices

1. **Consistency**: Use the same font family throughout your app
2. **Hierarchy**: Use different font weights and sizes to create visual hierarchy
3. **Readability**: Ensure sufficient contrast and appropriate font sizes
4. **Performance**: Don't load unnecessary font weights
5. **Accessibility**: Test with different font sizes and accessibility settings
