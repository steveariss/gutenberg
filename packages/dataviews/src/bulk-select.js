/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { bulkSelect, bulkSelected } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
} = unlock( componentsPrivateApis );

function ActionWithModal( {
	action,
	selectedItems,
	setActionWithModal,
	onMenuOpenChange,
} ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => action.isEligible( item ) );
	}, [ action, selectedItems ] );
	const { RenderModal, hideModalHeader } = action;
	const onCloseModal = useCallback( () => {
		setActionWithModal( undefined );
	}, [ setActionWithModal ] );
	return (
		<Modal
			title={ ! hideModalHeader && action.label }
			__experimentalHideHeader={ !! hideModalHeader }
			onRequestClose={ onCloseModal }
			overlayClassName="dataviews-action-modal"
		>
			<RenderModal
				items={ eligibleItems }
				closeModal={ onCloseModal }
				onPerform={ () => onMenuOpenChange( false ) }
			/>
		</Modal>
	);
}

export default function BulkSelectOptions( {
	data,
	actions,
	selection,
	onSelectionChange,
	getItemId,
} ) {
	const bulkSelectOptions = useMemo(
		() => actions.filter( ( action ) => action.supportsBulk ),
		[ actions ]
	);
	const [ isMenuOpen, onMenuOpenChange ] = useState( false );
	const [ actionWithModal, setActionWithModal ] = useState();
	const selectedItems = useMemo( () => {
		return data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);
	}, [ selection, data, getItemId ] );
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return bulkSelectOptions.some( ( action ) =>
				action.isEligible( item )
			);
		} );
	}, [ data, bulkSelectOptions ] );
	const numberSelectableItems = selectableItems.length;
	const areAllSelected =
		selection && selection.length === numberSelectableItems;

	const hasNonSelectableItemSelected = useMemo( () => {
		return selectedItems.some( ( item ) => {
			return ! selectableItems.includes( item );
		} );
	}, [ selectedItems, selectableItems ] );
	useEffect( () => {
		if ( hasNonSelectableItemSelected ) {
			onSelectionChange(
				selectedItems.filter( ( selectedItem ) => {
					return selectableItems.some( ( item ) => {
						return getItemId( selectedItem ) === getItemId( item );
					} );
				} )
			);
		}
	}, [
		hasNonSelectableItemSelected,
		selectedItems,
		selectableItems,
		getItemId,
		onSelectionChange,
	] );

	if ( bulkSelectOptions.length === 0 ) {
		return null;
	}
	return (
		<>
			{ selection.length > 0 && (
				<div className="dataviews-bulk-edit-button__selection-count">
					{
						/* translators: %d: Number of items. */
						sprintf( '%d selected', selection.length )
					}
				</div>
			) }
			<DropdownMenu
				open={ isMenuOpen }
				onOpenChange={ onMenuOpenChange }
				label={ __( 'Bulk actions' ) }
				style={ { minWidth: '240px' } }
				trigger={
					<Button
						className="dataviews-bulk-edit-button"
						__next40pxDefaultSize
						size="compact"
						label={ __( 'Bulk select' ) }
						icon={
							selection.length === 0 ? bulkSelect : bulkSelected
						}
					/>
				}
			>
				<DropdownMenuGroup>
					<DropdownMenuItem
						disabled={ areAllSelected }
						hideOnClick={ false }
						onClick={ () => {
							onSelectionChange( selectableItems );
						} }
						suffix={ numberSelectableItems }
					>
						{ __( 'Select all' ) }
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={ selection.length === 0 }
						hideOnClick={ false }
						onClick={ () => {
							onSelectionChange( [] );
						} }
					>
						{ __( 'Deselect' ) }
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenu>
			{ actionWithModal && (
				<ActionWithModal
					action={ actionWithModal }
					selectedItems={ selectedItems }
					setActionWithModal={ setActionWithModal }
					onMenuOpenChange={ onMenuOpenChange }
				/>
			) }
		</>
	);
}
