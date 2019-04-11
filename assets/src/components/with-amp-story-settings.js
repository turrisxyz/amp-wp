/**
 * WordPress dependencies
 */
import {
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	withColors,
	withFontSizes,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import { PanelBody, RangeControl, SelectControl, ToggleControl, withFallbackStyles } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { StoryBlockMover, FontFamilyPicker, ResizableBox, AnimationControls } from './';
import { ALLOWED_CHILD_BLOCKS, ALLOWED_MOVABLE_BLOCKS } from '../constants';
import { maybeEnqueueFontStyle } from '../helpers';

const { getComputedStyle } = window;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor, fontSize, customFontSize } = ownProps;
	const editableNode = node.querySelector( '[contenteditable="true"]' );
	const computedStyles = editableNode ? getComputedStyle( editableNode ) : null;

	return {
		fallbackBackgroundColor: backgroundColor || ! computedStyles ? undefined : computedStyles.backgroundColor,
		fallbackTextColor: textColor || ! computedStyles ? undefined : computedStyles.color,
		fallbackFontSize: fontSize || customFontSize || ! computedStyles ? undefined : parseInt( computedStyles.fontSize ) || undefined,
	};
} );

const applyWithSelect = withSelect( ( select, props ) => {
	const { getSelectedBlockClientId, getBlockRootClientId, getBlock } = select( 'core/editor' );
	const { getAnimatedBlocks, isValidAnimationPredecessor } = select( 'amp/story' );

	const currentBlock = getSelectedBlockClientId();
	const page = getBlockRootClientId( currentBlock );

	const animatedBlocks = getAnimatedBlocks()[ page ] || [];
	const animationOrderEntry = animatedBlocks.find( ( { id } ) => id === props.clientId );

	return {
		parentBlock: getBlock( getBlockRootClientId( props.clientId ) ),
		// Use parent's clientId instead of anchor attribute.
		// The attribute will be updated via subscribers.
		animationAfter: animationOrderEntry ? animationOrderEntry.parent : undefined,
		getAnimatedBlocks() {
			return ( getAnimatedBlocks()[ page ] || [] )
				.filter( ( { id } ) => id !== currentBlock )
				.filter( ( { id } ) => {
					const block = getBlock( id );

					return block && block.attributes.ampAnimationType && isValidAnimationPredecessor( page, currentBlock, id );
				} )
				.map( ( { id } ) => {
					const block = getBlock( id );
					return {
						value: id,
						label: block.name,
						block,
						blockType: getBlockType( block.name ),
					};
				} );
		},
	};
} );

const applyWithDispatch = withDispatch( ( dispatch, props, { select } ) => {
	const {
		getSelectedBlockClientId,
		getBlockRootClientId,
	} = select( 'core/editor' );

	const item = getSelectedBlockClientId();
	const page = getBlockRootClientId( item );

	const {
		addAnimation,
		changeAnimationType,
		changeAnimationDuration,
		changeAnimationDelay,
	} = dispatch( 'amp/story' );

	return {
		onAnimationTypeChange( type ) {
			changeAnimationType( page, item, type );
		},
		onAnimationOrderChange( predecessor ) {
			addAnimation( page, item, predecessor );
		},
		onAnimationDurationChange( value ) {
			changeAnimationDuration( page, item, value );
		},
		onAnimationDelayChange( value ) {
			changeAnimationDelay( page, item, value );
		},
	};
} );

const enhance = compose(
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
	applyWithSelect,
	applyWithDispatch,
);

export default createHigherOrderComponent(
	( BlockEdit ) => {
		return enhance( ( props ) => {
			const {
				name,
				attributes,
				isSelected,
				toggleSelection,
				fontSize,
				setFontSize,
				setAttributes,
				backgroundColor,
				setBackgroundColor,
				textColor,
				setTextColor,
				fallbackBackgroundColor,
				fallbackTextColor,
				onAnimationTypeChange,
				onAnimationOrderChange,
				onAnimationDurationChange,
				onAnimationDelayChange,
				getAnimatedBlocks,
				animationAfter,
			} = props;

			const isChildBlock = ALLOWED_CHILD_BLOCKS.includes( name );

			if ( ! isChildBlock ) {
				return <BlockEdit { ...props } />;
			}

			const isImageBlock = 'core/image' === name;
			const isTextBlock = 'amp/amp-story-text' === name;
			const isMovableBLock = ALLOWED_MOVABLE_BLOCKS.includes( name );

			const {
				ampFontFamily,
				ampFitText,
				height,
				width,
				opacity,
				type: textBlockTextType,
				ampShowImageCaption,
				ampAnimationType,
				ampAnimationDuration,
				ampAnimationDelay,
			} = attributes;

			const minTextHeight = 20;
			const minTextWidth = 30;

			return (
				<Fragment>
					{ isMovableBLock && (
						<StoryBlockMover
							clientIds={ props.clientId }
							blockElementId={ `block-${ props.clientId }` }
							isFirst={ props.isFirst }
							isLast={ props.isLast }
							isFocused={ props.isFocused }
							isDraggable={ ! props.isPartOfMultiSelection }
						/>
					) }
					{ ! isMovableBLock && ( <BlockEdit { ...props } /> ) }
					{ isMovableBLock && (
						<ResizableBox
							isSelected={ isSelected }
							width={ width }
							height={ height }
							minHeight={ minTextHeight }
							minWidth={ minTextWidth }
							onResizeStop={ ( value ) => {
								setAttributes( value );
								toggleSelection( true );
							} }
							onResizeStart={ () => {
								toggleSelection( false );
							} }
						>
							<BlockEdit { ...props } />
						</ResizableBox>
					) }
					{ isMovableBLock && (
						<InspectorControls>
							<PanelBody title={ __( 'Text Settings', 'amp' ) }>
								<FontFamilyPicker
									value={ ampFontFamily }
									onChange={ ( value ) => {
										maybeEnqueueFontStyle( value );
										setAttributes( { ampFontFamily: value } );
									} }
								/>
								{ ! ampFitText && (
									<FontSizePicker
										value={ fontSize.size }
										onChange={ setFontSize }
									/>
								) }
								{ isTextBlock && (
									<ToggleControl
										label={ __( 'Automatically fit text to container', 'amp' ) }
										checked={ ampFitText }
										onChange={ () => ( setAttributes( { ampFitText: ! ampFitText } ) ) }
									/>
								) }
								{ isTextBlock && (
									<SelectControl
										label={ __( 'Select text type', 'amp' ) }
										value={ textBlockTextType }
										onChange={ ( selected ) => setAttributes( { type: selected } ) }
										options={ [
											{ value: 'auto', label: __( 'Automatic', 'amp' ) },
											{ value: 'p', label: __( 'Paragraph', 'amp' ) },
											{ value: 'h1', label: __( 'Heading 1', 'amp' ) },
											{ value: 'h2', label: __( 'Heading 2', 'amp' ) },
										] }
									/>
								) }
							</PanelBody>
							<PanelColorSettings
								title={ __( 'Color Settings', 'amp' ) }
								initialOpen={ false }
								colorSettings={ [
									{
										value: backgroundColor.color,
										onChange: setBackgroundColor,
										label: __( 'Background Color', 'amp' ),
									},
									{
										value: textColor.color,
										onChange: setTextColor,
										label: __( 'Text Color', 'amp' ),
									},
								] }
							>
								<ContrastChecker
									{ ...{
										textColor: textColor.color,
										backgroundColor: backgroundColor.color,
										fallbackTextColor,
										fallbackBackgroundColor,
										fontSize: fontSize.size,
									} }
								/>
								<RangeControl
									label={ __( 'Background Opacity', 'amp' ) }
									value={ opacity }
									onChange={ ( value ) => setAttributes( { opacity: value } ) }
									min={ 5 }
									max={ 100 }
									step={ 5 }
								/>
							</PanelColorSettings>
							<PanelBody
								title={ __( 'Animation', 'amp' ) }
							>
								<AnimationControls
									animatedBlocks={ getAnimatedBlocks }
									animationType={ ampAnimationType }
									animationDuration={ ampAnimationDuration ? parseInt( ampAnimationDuration ) : '' }
									animationDelay={ ampAnimationDelay ? parseInt( ampAnimationDelay ) : '' }
									animationAfter={ animationAfter }
									onAnimationTypeChange={ onAnimationTypeChange }
									onAnimationDurationChange={ onAnimationDurationChange }
									onAnimationDelayChange={ onAnimationDelayChange }
									onAnimationAfterChange={ onAnimationOrderChange }
								/>
							</PanelBody>
						</InspectorControls>
					) }
					{ isImageBlock && (
						<InspectorControls>
							<PanelBody
								title={ __( 'Story Settings', 'amp' ) }
							>
								<ToggleControl
									key="position"
									label={ __( 'Show or hide the caption', 'amp' ) }
									checked={ ampShowImageCaption }
									onChange={
										function() {
											props.setAttributes( { ampShowImageCaption: ! attributes.ampShowImageCaption } );
											if ( ! attributes.ampShowImageCaption ) {
												props.setAttributes( { caption: '' } );
											}
										}
									}
									help={ __( 'Toggle on to show image caption. If you turn this off the current caption text will be deleted.', 'amp' ) }
								/>
							</PanelBody>
						</InspectorControls>
					) }
				</Fragment>
			);
		} );
	},
	'withAmpStorySettings'
);
