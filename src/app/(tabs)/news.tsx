import { useFocusEffect } from "expo-router";
import {
    Bell,
    CalendarDays,
    Megaphone,
    Newspaper,
    Pencil,
    Plus,
    RefreshCw,
    Sparkles,
    Trash2,
    X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    ADMIN_TEAM_ID,
    DATABASE_ID,
    ID,
    Permission,
    Query,
    Role,
    TABLES,
    tablesDB,
} from "../../lib/appwrite";

type NewsItem = {
  $id: string;
  $createdAt: string;
  title: string;
  content: string;
  category: string;
};

type NewsCategory = "announcement" | "update" | "tournament" | "maintenance";

const PURPLE = "#A78BFA";
const MUTED = "#AAA3C2";

const CATEGORIES: {
  label: string;
  value: NewsCategory;
  color: string;
}[] = [
  {
    label: "Announcement",
    value: "announcement",
    color: "purple",
  },
  {
    label: "Update",
    value: "update",
    color: "sky",
  },
  {
    label: "Tournament",
    value: "tournament",
    color: "amber",
  },
  {
    label: "Maintenance",
    value: "maintenance",
    color: "rose",
  },
];

function getCategoryStyle(category: string) {
  switch (category?.toLowerCase()) {
    case "update":
      return {
        text: "text-sky-400",
        background: "bg-sky-400/10",
      };

    case "tournament":
      return {
        text: "text-amber-400",
        background: "bg-amber-400/10",
      };

    case "maintenance":
      return {
        text: "text-rose-400",
        background: "bg-rose-400/10",
      };

    default:
      return {
        text: "text-[#C4B5FD]",
        background: "bg-[#A78BFA]/10",
      };
  }
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function NewsCard({
  item,
  onEdit,
  onDelete,
}: {
  item: NewsItem;
  onEdit: (item: NewsItem) => void;
  onDelete: (item: NewsItem) => void;
}) {
  const categoryStyle = getCategoryStyle(item.category);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-[#332A4B] bg-[#1D1833]">
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View
            className={`rounded-md px-2.5 py-1.5 ${categoryStyle.background}`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${categoryStyle.text}`}
            >
              {item.category}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={12} color="#827B98" />

            <Text className="text-[11px] text-[#827B98]">
              {formatDate(item.$createdAt)}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold leading-6 text-white">
          {item.title}
        </Text>

        <Text
          className="mt-2 text-sm leading-6 text-[#AAA3C2]"
          numberOfLines={5}
        >
          {item.content}
        </Text>

        <View className="my-4 h-px bg-[#332A4B]" />

        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold tracking-widest text-[#77708F]">
            BOOYAHX NEWS
          </Text>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => onEdit(item)}
              className="flex-row items-center gap-1.5 rounded-lg bg-[#A78BFA]/10 px-3 py-2 active:opacity-70"
            >
              <Pencil size={13} color={PURPLE} />
              <Text className="text-xs font-bold text-[#C4B5FD]">Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => onDelete(item)}
              className="flex-row items-center gap-1.5 rounded-lg bg-red-400/10 px-3 py-2 active:opacity-70"
            >
              <Trash2 size={13} color="#F87171" />
              <Text className="text-xs font-bold text-red-400">Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsCategory>("announcement");

  // Load news
  const loadNews = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      setError("");

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.news,
        queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
      });

      if (isActive()) {
        setNews((response.rows ?? []) as NewsItem[]);
      }
    } catch (err: unknown) {
      console.log("Admin news loading error:", err);

      if (isActive()) {
        setError(err instanceof Error ? err.message : "Unable to load news.");
      }
    } finally {
      if (isActive()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload when screen gets focus
  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadNews(() => active);

      return () => {
        active = false;
      };
    }, [loadNews]),
  );

  // Reset form
  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("announcement");
    setEditingNews(null);
  }

  // Open create modal
  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  // Open edit modal
  function openEditModal(item: NewsItem) {
    setEditingNews(item);
    setTitle(item.title);
    setContent(item.content);

    // Fixed category selection
    const existingCategory = CATEGORIES.find(
      (categoryItem) => categoryItem.value === item.category,
    );

    setCategory(existingCategory ? existingCategory.value : "announcement");

    setModalVisible(true);
  }

  // Close modal
  function closeModal() {
    if (saving) return;

    setModalVisible(false);
    resetForm();
  }

  // Create or update news
  async function handleSave() {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      Alert.alert(
        "Missing Information",
        "Please enter both title and content.",
      );
      return;
    }

    if (cleanTitle.length > 150) {
      Alert.alert("Title Too Long", "Title must be 150 characters or less.");
      return;
    }

    try {
      setSaving(true);

      if (editingNews) {
        const updated = await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.news,
          rowId: editingNews.$id,
          data: {
            title: cleanTitle,
            content: cleanContent,
            category,
          },
        });

        setNews((previous) =>
          previous.map((item) =>
            item.$id === editingNews.$id ? (updated as NewsItem) : item,
          ),
        );

        Alert.alert("Updated", "News has been updated successfully.");
      } else {
        const created = await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.news,
          rowId: ID.unique(),
          data: {
            title: cleanTitle,
            content: cleanContent,
            category,
          },
          permissions: [
            Permission.read(Role.any()),
            Permission.update(Role.team(ADMIN_TEAM_ID)),
            Permission.delete(Role.team(ADMIN_TEAM_ID)),
          ],
        });

        setNews((previous) => [created as NewsItem, ...previous]);

        Alert.alert("Published", "Your news has been published.");
      }

      setModalVisible(false);
      resetForm();
    } catch (err: unknown) {
      console.log("News save error:", err);

      Alert.alert(
        editingNews ? "Update Failed" : "Publish Failed",
        err instanceof Error ? err.message : "Unable to save news.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete news
  function handleDelete(item: NewsItem) {
    Alert.alert(
      "Delete News",
      `Are you sure you want to delete "${item.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: TABLES.news,
                rowId: item.$id,
              });

              setNews((previous) =>
                previous.filter((newsItem) => newsItem.$id !== item.$id),
              );
            } catch (err: unknown) {
              console.log("News delete error:", err);

              Alert.alert(
                "Delete Failed",
                err instanceof Error ? err.message : "Unable to delete news.",
              );

              await loadNews();
            }
          },
        },
      ],
    );
  }

  // Refresh
  function handleRefresh() {
    setRefreshing(true);
    loadNews();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator size="large" color={PURPLE} />

        <Text className="mt-4 text-sm text-[#AAA3C2]">Loading news...</Text>
      </SafeAreaView>
    );
  }

  const featuredNews = news[0];

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
      >
        {/* Header */}
        <View className="mb-6 mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold tracking-[3px] text-[#A78BFA]">
              BOOYAHX ADMIN
            </Text>

            <Text className="mt-2 text-3xl font-extrabold text-white">
              News
            </Text>

            <Text className="mt-1 text-sm text-[#827B98]">
              Manage announcements and updates.
            </Text>
          </View>

          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-[#332A4B] bg-[#1D1833]">
            <Bell size={19} color={PURPLE} />
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={openCreateModal}
          className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] p-4 active:opacity-80"
        >
          <Plus size={18} color="#FFFFFF" />

          <Text className="font-bold text-white">
            Create News / Announcement
          </Text>
        </Pressable>

        {/* Statistics */}
        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
            <Newspaper size={19} color={PURPLE} />

            <Text className="mt-3 text-2xl font-extrabold text-white">
              {news.length}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">Total Posts</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
            <Megaphone size={19} color="#FBBF24" />

            <Text className="mt-3 text-2xl font-extrabold text-white">
              {news.filter((item) => item.category === "announcement").length}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">Announcements</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-5 rounded-2xl border border-red-400/20 bg-[#291A2A] p-4">
            <Text className="font-bold text-red-300">Unable to load news</Text>

            <Text className="mt-2 text-xs leading-5 text-[#D5A9B5]">
              {error}
            </Text>

            <Pressable
              onPress={handleRefresh}
              className="mt-4 flex-row items-center gap-2 self-start rounded-xl bg-[#452638] px-4 py-2.5"
            >
              <RefreshCw size={13} color="#FCA5A5" />

              <Text className="text-xs font-bold text-red-200">Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Featured News */}
        {!error && featuredNews ? (
          <View className="mb-6 overflow-hidden rounded-3xl border border-[#49366C] bg-[#211936]">
            <View className="p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#A78BFA]/15">
                    <Megaphone size={16} color={PURPLE} />
                  </View>

                  <Text className="text-xs font-bold text-[#C4B5FD]">
                    LATEST PUBLISHED NEWS
                  </Text>
                </View>

                <Sparkles size={17} color={PURPLE} />
              </View>

              <Text className="text-xl font-extrabold leading-7 text-white">
                {featuredNews.title}
              </Text>

              <Text
                className="mt-3 text-sm leading-6 text-[#B8AFCB]"
                numberOfLines={4}
              >
                {featuredNews.content}
              </Text>

              <View className="mt-5 flex-row items-center justify-between border-t border-[#49366C] pt-4">
                <View
                  className={`rounded-md px-2.5 py-1.5 ${
                    getCategoryStyle(featuredNews.category).background
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      getCategoryStyle(featuredNews.category).text
                    }`}
                  >
                    {featuredNews.category}
                  </Text>
                </View>

                <Text className="text-[11px] text-[#827B98]">
                  {formatDate(featuredNews.$createdAt)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* News List Heading */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Newspaper size={17} color={PURPLE} />

            <Text className="text-lg font-bold text-white">
              All Published News
            </Text>
          </View>

          <Text className="text-xs text-[#827B98]">{news.length} posts</Text>
        </View>

        {/* News List */}
        {!error && news.length > 0
          ? news.map((item) => (
              <NewsCard
                key={item.$id}
                item={item}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          : null}

        {/* Empty State */}
        {!error && news.length === 0 ? (
          <View className="items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] px-6 py-10">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#A78BFA]/10">
              <Newspaper size={25} color={PURPLE} />
            </View>

            <Text className="mt-4 text-base font-bold text-white">
              No news published
            </Text>

            <Text className="mt-2 text-center text-sm leading-6 text-[#827B98]">
              Create your first announcement or tournament update.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/70">
          <SafeAreaView
            className="max-h-[90%] rounded-t-3xl border border-[#49366C] bg-[#171329]"
            edges={["bottom"]}
          >
            <ScrollView
              className="px-5 pt-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View className="mb-6 flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-extrabold text-white">
                    {editingNews ? "Edit News" : "Create News"}
                  </Text>

                  <Text className="mt-1 text-xs text-[#AAA3C2]">
                    {editingNews
                      ? "Update your published content."
                      : "Write a new announcement for players."}
                  </Text>
                </View>

                <Pressable
                  onPress={closeModal}
                  disabled={saving}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-[#29223E]"
                >
                  <X size={19} color={MUTED} />
                </Pressable>
              </View>

              {/* Title */}
              <Text className="mb-2 text-sm font-semibold text-[#D6D0E5]">
                News Title
              </Text>

              <TextInput
                className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
                placeholder="Enter news title"
                placeholderTextColor="#817A96"
                value={title}
                onChangeText={setTitle}
                maxLength={150}
                editable={!saving}
              />

              <Text className="mt-1 text-right text-[10px] text-[#827B98]">
                {title.length}/150
              </Text>

              {/* Category */}
              <Text className="mb-3 mt-5 text-sm font-semibold text-[#D6D0E5]">
                Category
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((item) => {
                  const active = category === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setCategory(item.value)}
                      disabled={saving}
                      className={`rounded-xl border px-3 py-3 ${
                        active
                          ? "border-[#7C3AED] bg-[#7C3AED]/20"
                          : "border-[#332A4B] bg-[#1D1833]"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          active ? "text-[#C4B5FD]" : "text-[#AAA3C2]"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Content */}
              <Text className="mb-2 mt-5 text-sm font-semibold text-[#D6D0E5]">
                News Content
              </Text>

              <TextInput
                className="min-h-40 rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-sm leading-6 text-white"
                placeholder="Write your announcement here..."
                placeholderTextColor="#817A96"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                editable={!saving}
              />

              {/* Publish Button */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className={`mb-6 mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-[#7C3AED] p-4 ${
                  saving ? "opacity-60" : "active:opacity-80"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : editingNews ? (
                  <Pencil size={17} color="#FFFFFF" />
                ) : (
                  <Plus size={18} color="#FFFFFF" />
                )}

                <Text className="font-bold text-white">
                  {saving
                    ? "Saving..."
                    : editingNews
                      ? "Save Changes"
                      : "Publish News"}
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
