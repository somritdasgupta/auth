import { ensureElectron } from "@/next/electron";
import {
    FlexWrapper,
    HorizontalFlex,
    SpaceBetweenFlex,
    VerticallyCentered,
} from "@ente/shared/components/Container";
import DialogTitleWithCloseButton from "@ente/shared/components/DialogBox/TitleWithCloseButton";
import OverflowMenu from "@ente/shared/components/OverflowMenu/menu";
import { OverflowMenuOption } from "@ente/shared/components/OverflowMenu/option";
import CheckIcon from "@mui/icons-material/Check";
import DoNotDisturbOutlinedIcon from "@mui/icons-material/DoNotDisturbOutlined";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import UploadStrategyChoiceModal from "components/Upload/UploadStrategyChoiceModal";
import { PICKED_UPLOAD_TYPE, UPLOAD_STRATEGY } from "constants/upload";
import { t } from "i18next";
import { AppContext } from "pages/_app";
import React, { useContext, useEffect, useState } from "react";
import watcher from "services/watch";
import { WatchMapping as FolderWatch } from "types/watchFolder";
import { getImportSuggestion } from "utils/upload";

interface WatchFolderProps {
    open: boolean;
    onClose: () => void;
}

/**
 * View the state of and manage folder watches.
 *
 * This is the screen that controls that "watch folder" feature in the app.
 */
export const WatchFolder: React.FC<WatchFolderProps> = ({ open, onClose }) => {
    const [watches, setWatches] = useState<FolderWatch[] | undefined>();
    const [inputFolderPath, setInputFolderPath] = useState<
        string | undefined
    >();
    const [choiceModalOpen, setChoiceModalOpen] = useState(false);
    const appContext = useContext(AppContext);

    useEffect(() => {
        watcher.getWatchMappings().then((ws) => setWatches(ws));
    }, []);

    useEffect(() => {
        if (
            appContext.watchFolderFiles &&
            appContext.watchFolderFiles.length > 0
        ) {
            handleFolderDrop(appContext.watchFolderFiles);
            appContext.setWatchFolderFiles(null);
        }
    }, [appContext.watchFolderFiles]);

    const handleFolderDrop = async (folders: FileList) => {
        for (let i = 0; i < folders.length; i++) {
            const folder: any = folders[i];
            const path = (folder.path as string).replace(/\\/g, "/");
            if (await watcher.isFolder(path)) {
                await addFolderForWatching(path);
            }
        }
    };

    const addFolderForWatching = async (path: string) => {
        setInputFolderPath(path);
        const files = await ensureElectron().getDirFiles(path);
        const analysisResult = getImportSuggestion(
            PICKED_UPLOAD_TYPE.FOLDERS,
            files,
        );
        if (analysisResult.hasNestedFolders) {
            setChoiceModalOpen(true);
        } else {
            handleAddWatchMapping(UPLOAD_STRATEGY.SINGLE_COLLECTION, path);
        }
    };

    const handleAddWatchMapping = async (
        uploadStrategy: UPLOAD_STRATEGY,
        folderPath?: string,
    ) => {
        folderPath = folderPath || inputFolderPath;
        await watcher.addWatchMapping(
            folderPath.substring(folderPath.lastIndexOf("/") + 1),
            folderPath,
            uploadStrategy,
        );
        setInputFolderPath("");
        setWatches(await watcher.getWatchMappings());
    };

    const addWatch = async () => {
        const folderPath = await watcher.selectFolder();
        if (folderPath) {
            await addFolderForWatching(folderPath);
        }
    };

    const removeWatch = async (watch: FolderWatch) => {
        await watcher.removeWatchForFolderPath(watch.folderPath);
        setWatches(await watcher.getWatchMappings());
    };

    const closeChoiceModal = () => setChoiceModalOpen(false);

    const uploadToSingleCollection = () => {
        closeChoiceModal();
        handleAddWatchMapping(UPLOAD_STRATEGY.SINGLE_COLLECTION);
    };

    const uploadToMultipleCollection = () => {
        closeChoiceModal();
        handleAddWatchMapping(UPLOAD_STRATEGY.COLLECTION_PER_FOLDER);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{ sx: { height: "448px", maxWidth: "414px" } }}
            >
                <DialogTitleWithCloseButton
                    onClose={onClose}
                    sx={{ "&&&": { padding: "32px 16px 16px 24px" } }}
                >
                    {t("WATCHED_FOLDERS")}
                </DialogTitleWithCloseButton>
                <DialogContent sx={{ flex: 1 }}>
                    <Stack spacing={1} p={1.5} height={"100%"}>
                        <WatchList {...{ watches, removeWatch }} />
                        <Button fullWidth color="accent" onClick={addWatch}>
                            <span>+</span>
                            <span
                                style={{
                                    marginLeft: "8px",
                                }}
                            ></span>
                            {t("ADD_FOLDER")}
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
            <UploadStrategyChoiceModal
                open={choiceModalOpen}
                onClose={closeChoiceModal}
                uploadToSingleCollection={uploadToSingleCollection}
                uploadToMultipleCollection={uploadToMultipleCollection}
            />
        </>
    );
};

interface WatchList {
    watches: FolderWatch[];
    removeWatch: (watch: FolderWatch) => void;
}

const WatchList: React.FC<WatchList> = ({ watches, removeWatch }) => {
    return watches.length === 0 ? (
        <NoWatches />
    ) : (
        <WatchesContainer>
            {watches.map((mapping) => {
                return (
                    <WatchEntry
                        key={mapping.rootFolderName}
                        watch={mapping}
                        removeWatch={removeWatch}
                    />
                );
            })}
        </WatchesContainer>
    );
};

const WatchesContainer = styled(Box)(() => ({
    height: "278px",
    overflow: "auto",
    "&::-webkit-scrollbar": {
        width: "4px",
    },
}));

const NoWatches: React.FC = () => {
    return (
        <NoMappingsContainer>
            <Stack spacing={1}>
                <Typography variant="large" fontWeight={"bold"}>
                    {t("NO_FOLDERS_ADDED")}
                </Typography>
                <Typography py={0.5} variant={"small"} color="text.muted">
                    {t("FOLDERS_AUTOMATICALLY_MONITORED")}
                </Typography>
                <Typography variant={"small"} color="text.muted">
                    <FlexWrapper gap={1}>
                        <CheckmarkIcon />
                        {t("UPLOAD_NEW_FILES_TO_ENTE")}
                    </FlexWrapper>
                </Typography>
                <Typography variant={"small"} color="text.muted">
                    <FlexWrapper gap={1}>
                        <CheckmarkIcon />
                        {t("REMOVE_DELETED_FILES_FROM_ENTE")}
                    </FlexWrapper>
                </Typography>
            </Stack>
        </NoMappingsContainer>
    );
};

const NoMappingsContainer = styled(VerticallyCentered)({
    textAlign: "left",
    alignItems: "flex-start",
    marginBottom: "32px",
});

const CheckmarkIcon: React.FC = () => {
    return (
        <CheckIcon
            fontSize="small"
            sx={{
                display: "inline",
                fontSize: "15px",
                color: (theme) => theme.palette.secondary.main,
            }}
        />
    );
};

interface WatchEntryProps {
    watch: FolderWatch;
    removeWatch: (watch: FolderWatch) => void;
}

const WatchEntry: React.FC<WatchEntryProps> = ({ watch, removeWatch }) => {
    const appContext = React.useContext(AppContext);

    const confirmStopWatching = () => {
        appContext.setDialogMessage({
            title: t("STOP_WATCHING_FOLDER"),
            content: t("STOP_WATCHING_DIALOG_MESSAGE"),
            close: {
                text: t("CANCEL"),
                variant: "secondary",
            },
            proceed: {
                action: () => removeWatch(watch),
                text: t("YES_STOP"),
                variant: "critical",
            },
        });
    };

    return (
        <SpaceBetweenFlex>
            <HorizontalFlex>
                {watch.uploadStrategy === UPLOAD_STRATEGY.SINGLE_COLLECTION ? (
                    <Tooltip title={t("UPLOADED_TO_SINGLE_COLLECTION")}>
                        <FolderOpenIcon />
                    </Tooltip>
                ) : (
                    <Tooltip title={t("UPLOADED_TO_SEPARATE_COLLECTIONS")}>
                        <FolderCopyOutlinedIcon />
                    </Tooltip>
                )}
                <EntryContainer>
                    <EntryHeading watch={watch} />
                    <Typography color="text.muted" variant="small">
                        {watch.folderPath}
                    </Typography>
                </EntryContainer>
            </HorizontalFlex>
            <EntryOptions {...{ confirmStopWatching }} />
        </SpaceBetweenFlex>
    );
};

const EntryContainer = styled(Box)({
    marginLeft: "12px",
    marginRight: "6px",
    marginBottom: "12px",
});

interface EntryHeadingProps {
    watch: FolderWatch;
}

const EntryHeading: React.FC<EntryHeadingProps> = ({ watch }) => {
    const appContext = useContext(AppContext);
    return (
        <FlexWrapper gap={1}>
            <Typography>{watch.rootFolderName}</Typography>
            {appContext.isFolderSyncRunning &&
                watcher.isSyncingWatch(watch) && <CircularProgress size={12} />}
        </FlexWrapper>
    );
};

interface EntryOptionsProps {
    confirmStopWatching: () => void;
}

const EntryOptions: React.FC<EntryOptionsProps> = ({ confirmStopWatching }) => {
    return (
        <OverflowMenu
            menuPaperProps={{
                sx: {
                    backgroundColor: (theme) =>
                        theme.colors.background.elevated2,
                },
            }}
            ariaControls={"watch-mapping-option"}
            triggerButtonIcon={<MoreHorizIcon />}
        >
            <OverflowMenuOption
                color="critical"
                onClick={confirmStopWatching}
                startIcon={<DoNotDisturbOutlinedIcon />}
            >
                {t("STOP_WATCHING")}
            </OverflowMenuOption>
        </OverflowMenu>
    );
};
